package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

var Handler *DatabaseHandler

type DatabaseHandler struct {
	Db *sql.DB
}

func InitDatabaseHandler(connString string) error {
	db, err := sql.Open("postgres", connString)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return fmt.Errorf("unable to reach database: %w", err)
	}

	Handler = &DatabaseHandler{Db: db}
	fmt.Println("Connected to the database successfully!")
	return nil
}

func main() {
	// Load environment variables from .env file (optional for Docker)
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file (this is OK if using Docker environment variables)")
	}

	// Build Supabase PostgreSQL connection string
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseDBPassword := os.Getenv("SUPABASE_DB_PASSWORD")

	if supabaseURL == "" || supabaseDBPassword == "" {
		log.Fatal("SUPABASE_URL and SUPABASE_DB_PASSWORD environment variables must be set.\n" +
			"Example: SUPABASE_URL=https://xxxxx.supabase.co\n" +
			"Get these from: https://supabase.com/dashboard/project/_/settings/api")
	}

	// Validate SUPABASE_URL format
	if len(supabaseURL) < 10 || (!strings.HasPrefix(supabaseURL, "https://") && !strings.HasPrefix(supabaseURL, "http://")) {
		log.Fatalf("SUPABASE_URL must be a valid URL (e.g., https://xxxxx.supabase.co), got: %s", supabaseURL)
	}

	// Extract project reference from Supabase URL
	// Format: https://xxxxx.supabase.co -> xxxxx
	projectRef := ""
	urlWithoutProtocol := strings.TrimPrefix(supabaseURL, "https://")
	urlWithoutProtocol = strings.TrimPrefix(urlWithoutProtocol, "http://")

	dotIndex := strings.Index(urlWithoutProtocol, ".")
	if dotIndex > 0 {
		projectRef = urlWithoutProtocol[:dotIndex]
	}

	if projectRef == "" || len(projectRef) < 10 {
		log.Fatalf("Could not extract valid project reference from SUPABASE_URL: %s\n"+
			"Expected format: https://xxxxx.supabase.co\n"+
			"Extracted: '%s'", supabaseURL, projectRef)
	}

	log.Printf("Connecting to Supabase project: %s", projectRef)

	var connectionEstablished bool

	// Option 0: Try DATABASE_URL if provided (exact connection string from Supabase)
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL != "" {
		log.Printf("Found DATABASE_URL, attempting connection...")
		err = InitDatabaseHandler(databaseURL)
		if err == nil {
			log.Printf("✅ Connected using DATABASE_URL!")
			connectionEstablished = true
		} else {
			log.Printf("⚠️ DATABASE_URL failed: %v", err)
		}
	}

	if !connectionEstablished {
		// Option 1: Try direct connection first (most reliable)
		log.Printf("Attempting direct connection...")
		connString := fmt.Sprintf(
			"postgresql://postgres:%s@db.%s.supabase.co:5432/postgres?sslmode=require",
			supabaseDBPassword,
			projectRef,
		)
		err = InitDatabaseHandler(connString)
		if err == nil {
			log.Printf("✅ Connected via direct connection!")
			connectionEstablished = true
		} else {
			log.Printf("⚠️ Direct connection failed: %v", err)
		}
	}

	if !connectionEstablished {
		// Option 2: Try us-west-1 session pooler (port 5432)
		log.Printf("Attempting us-west-1 session pooler (port 5432)...")
		connString := fmt.Sprintf(
			"postgresql://postgres.%s:%s@aws-1-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require",
			projectRef,
			supabaseDBPassword,
		)
		err = InitDatabaseHandler(connString)
		if err == nil {
			log.Printf("✅ Connected via us-west-1 session pooler!")
			connectionEstablished = true
		} else {
			log.Printf("⚠️ us-west-1 session pooler failed: %v", err)
		}
	}

	if !connectionEstablished {
		// Option 3: Try us-west-1 transaction pooler (port 6543)
		log.Printf("Attempting us-west-1 transaction pooler (port 6543)...")
		connString := fmt.Sprintf(
			"postgresql://postgres.%s:%s@aws-1-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require",
			projectRef,
			supabaseDBPassword,
		)
		err = InitDatabaseHandler(connString)
		if err == nil {
			log.Printf("✅ Connected via us-west-1 transaction pooler!")
			connectionEstablished = true
		} else {
			log.Printf("⚠️ us-west-1 transaction pooler failed: %v", err)
		}
	}


	if !connectionEstablished {
		log.Fatal("❌ All connection attempts failed.\n" +
			"Please check:\n" +
			"1. SUPABASE_DB_PASSWORD is correct (reset in Supabase dashboard if needed)\n" +
			"2. No special characters in password (or URL-encode them)\n" +
			"3. Or set DATABASE_URL with exact connection string from Supabase\n" +
			"Last error: " + err.Error())
	}

	log.Printf("✅ Database connection established!")

	router := gin.Default()

	// Enable CORS for Chrome extension
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "API is running",
		})
	})

	// Example: simple endpoint to check DB connectivity
	router.GET("/dbcheck", func(c *gin.Context) {
		var now string
		err := Handler.Db.QueryRow("SELECT NOW()").Scan(&now)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"time": now})
	})

	// Workspace endpoints
	router.POST("/api/workspaces", AddWorkspaces)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Changed default port to 8080 to avoid conflicts
	}
	router.Run("0.0.0.0:" + port)

}
