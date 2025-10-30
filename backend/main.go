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

	// Build connection string for Supabase PostgreSQL
	// Supabase uses direct connection format: db.{project-ref}.supabase.co
	// Add connect_timeout to fail faster if connection issues occur
	connString := fmt.Sprintf(
		"host=db.%s.supabase.co port=5432 user=postgres password=%s dbname=postgres sslmode=require connect_timeout=10",
		projectRef,
		supabaseDBPassword,
	)

	log.Printf("Attempting connection to: db.%s.supabase.co:5432", projectRef)

	err = InitDatabaseHandler(connString)
	if err != nil {
		log.Fatal("Error connecting to database:", err)
	}

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
