package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/contextkeeper/backend/config"
	"github.com/contextkeeper/backend/database"
	"github.com/contextkeeper/backend/handlers"
	"github.com/contextkeeper/backend/middleware"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize Supabase client
	db := database.NewClient(cfg.SupabaseURL, cfg.SupabaseServiceKey)

	// Initialize handlers
	workspaceHandler := &handlers.WorkspaceHandler{DB: db}
	groupHandler := &handlers.GroupHandler{DB: db}

	// Create router
	r := mux.NewRouter()

	// Middleware
	r.Use(middleware.LoggingMiddleware)

	// Health check endpoint
	r.HandleFunc("/health", healthCheckHandler).Methods("GET")

	// API routes
	api := r.PathPrefix("/api").Subrouter()

	// Workspace routes (protected)
	workspaces := api.PathPrefix("/workspaces").Subrouter()
	workspaces.Use(middleware.AuthMiddleware(db))
	workspaces.HandleFunc("", workspaceHandler.CreateWorkspace).Methods("POST")
	workspaces.HandleFunc("", workspaceHandler.GetWorkspaces).Methods("GET")
	workspaces.HandleFunc("/{id}", workspaceHandler.GetWorkspace).Methods("GET")
	workspaces.HandleFunc("/{id}", workspaceHandler.UpdateWorkspace).Methods("PUT")
	workspaces.HandleFunc("/{id}", workspaceHandler.DeleteWorkspace).Methods("DELETE")

	// Group routes (protected)
	groups := api.PathPrefix("/groups").Subrouter()
	groups.Use(middleware.AuthMiddleware(db))
	groups.HandleFunc("", groupHandler.CreateGroup).Methods("POST")
	groups.HandleFunc("", groupHandler.GetGroups).Methods("GET")
	groups.HandleFunc("/{id}", groupHandler.DeleteGroup).Methods("DELETE")

	// 404 handler
	r.NotFoundHandler = http.HandlerFunc(notFoundHandler)

	// CORS configuration
	c := cors.New(cors.Options{
		AllowedOrigins: getAllowedOrigins(cfg.AllowedOrigins),
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge: 300,
	})

	handler := c.Handler(r)

	// Print startup banner
	printBanner(cfg)

	// Start server
	addr := ":" + cfg.Port
	log.Printf("Starting server on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now().Format(time.RFC3339),
		"service":   "ContextKeeper API",
	})
}

func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(map[string]string{
		"error":   "Not Found",
		"message": fmt.Sprintf("Route %s %s not found", r.Method, r.URL.Path),
	})
}

func getAllowedOrigins(configured []string) []string {
	// Always allow chrome-extension origins
	return append(configured, "chrome-extension://*")
}

func printBanner(cfg *config.Config) {
	banner := strings.Repeat("=", 60)
	fmt.Println(banner)
	fmt.Println("🚀 ContextKeeper Backend Server (Go)")
	fmt.Println(banner)
	fmt.Printf("📡 Server running on: http://localhost:%s\n", cfg.Port)
	fmt.Printf("🌍 Environment: %s\n", cfg.Environment)
	fmt.Printf("✅ Health check: http://localhost:%s/health\n", cfg.Port)
	fmt.Println(banner)
	fmt.Println("Available endpoints:")
	fmt.Println("  POST   /api/workspaces     - Create workspace")
	fmt.Println("  GET    /api/workspaces     - Get all workspaces")
	fmt.Println("  GET    /api/workspaces/:id - Get workspace by ID")
	fmt.Println("  PUT    /api/workspaces/:id - Update workspace")
	fmt.Println("  DELETE /api/workspaces/:id - Delete workspace")
	fmt.Println("  POST   /api/groups         - Create group")
	fmt.Println("  GET    /api/groups         - Get all groups")
	fmt.Println("  DELETE /api/groups/:id     - Delete group")
	fmt.Println(banner)
}
