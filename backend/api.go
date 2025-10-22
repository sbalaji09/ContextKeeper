package main

import (
	"fmt"

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
