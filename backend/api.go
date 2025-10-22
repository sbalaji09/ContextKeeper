package main

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func ExtractIDFromJWT(jwtToken string) (string, error) {
	// Parse the JWT without verifying (for demo - for production always verify)
	token, _, err := new(jwt.Parser).ParseUnverified(jwtToken, jwt.MapClaims{})
	if err != nil {
		return "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		if sub, ok := claims["sub"].(string); ok {
			return sub, nil // This is the Supabase user ID
		}
	}

	return "", fmt.Errorf("user id (sub) not found in token")
}

func AddWorkspaces(c *gin.Context) {
	// You can uncomment JWT handling if needed:
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JWT_Token header is required"})
		return
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	tokenString = strings.TrimSpace(tokenString)

	userID, err := ExtractIDFromJWT(tokenString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired JWT"})
		return
	}
	fmt.Println("User ID from JWT:", userID)

}
