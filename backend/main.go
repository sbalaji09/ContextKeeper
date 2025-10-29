package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

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

	// Get the connection string from the environment
	connString := os.Getenv("POSTGRES_CONNECTION")
	if connString == "" {
		// Try DATABASE_URL as fallback (common in Docker/cloud deployments)
		connString = os.Getenv("DATABASE_URL")
	}
	if connString == "" {
		log.Fatal("POSTGRES_CONNECTION or DATABASE_URL environment variable must be set")
	}

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
