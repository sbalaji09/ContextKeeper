package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/contextkeeper/backend/database"
)

type contextKey string

const UserIDKey contextKey = "userID"

// AuthMiddleware verifies Supabase JWT tokens
func AuthMiddleware(db *database.Client) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				respondJSON(w, http.StatusUnauthorized, map[string]string{
					"error":   "Unauthorized",
					"message": "Missing authorization header",
				})
				return
			}

			// Extract token from "Bearer <token>"
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				respondJSON(w, http.StatusUnauthorized, map[string]string{
					"error":   "Unauthorized",
					"message": "Invalid authorization header format",
				})
				return
			}

			token := parts[1]

			// Verify token with Supabase
			userID, err := db.VerifyJWT(token)
			if err != nil {
				respondJSON(w, http.StatusUnauthorized, map[string]string{
					"error":   "Unauthorized",
					"message": "Invalid or expired token",
				})
				return
			}

			// Add user ID to request context
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserID extracts user ID from request context
func GetUserID(r *http.Request) string {
	userID, _ := r.Context().Value(UserIDKey).(string)
	return userID
}

// respondJSON writes a JSON response
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
