package main

// import (
// 	"database/sql"
// 	"fmt"
// 	"log"
// 	"os"

// 	"github.com/joho/godotenv"
// 	_ "github.com/lib/pq"
// )

// func main() {
// 	// Load .env
// 	err := godotenv.Load()
// 	if err != nil {
// 		log.Println("Warning: Could not load .env file")
// 	}

// 	// Get values
// 	supabaseURL := os.Getenv("SUPABASE_URL")
// 	dbPassword := os.Getenv("SUPABASE_DB_PASSWORD")
// 	databaseURL := os.Getenv("DATABASE_URL")

// 	fmt.Println("=== Connection Test ===")
// 	fmt.Println()

// 	// Show what we got (mask password)
// 	fmt.Printf("SUPABASE_URL: %s\n", supabaseURL)
// 	if dbPassword != "" {
// 		fmt.Printf("SUPABASE_DB_PASSWORD: (length: %d, has special chars: %v)\n",
// 			len(dbPassword),
// 			containsSpecialChars(dbPassword))
// 	} else {
// 		fmt.Println("SUPABASE_DB_PASSWORD: NOT SET")
// 	}
// 	if databaseURL != "" {
// 		masked := maskPassword(databaseURL)
// 		fmt.Printf("DATABASE_URL: %s\n", masked)
// 	} else {
// 		fmt.Println("DATABASE_URL: NOT SET")
// 	}

// 	fmt.Println()
// 	fmt.Println("=== Testing Connections ===")
// 	fmt.Println()

// 	// Test 1: DATABASE_URL if provided
// 	if databaseURL != "" {
// 		fmt.Println("Test 1: Using DATABASE_URL...")
// 		db, err := sql.Open("postgres", databaseURL)
// 		if err != nil {
// 			fmt.Printf("❌ Open failed: %v\n", err)
// 		} else {
// 			err = db.Ping()
// 			if err != nil {
// 				fmt.Printf("❌ Ping failed: %v\n", err)
// 			} else {
// 				fmt.Println("✅ SUCCESS with DATABASE_URL!")
// 				db.Close()
// 				return
// 			}
// 			db.Close()
// 		}
// 		fmt.Println()
// 	}

// 	// Test 2: Build connection string
// 	if supabaseURL != "" && dbPassword != "" {
// 		projectRef := extractProjectRef(supabaseURL)
// 		fmt.Printf("Extracted project ref: %s\n", projectRef)
// 		fmt.Println()

// 		// Try session pooler
// 		fmt.Println("Test 2: Session pooler (port 5432)...")
// 		connStr := fmt.Sprintf(
// 			"postgresql://postgres.%s:%s@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require",
// 			projectRef, dbPassword)
// 		testConnection(connStr)

// 		// Try transaction pooler
// 		fmt.Println("Test 3: Transaction pooler (port 6543)...")
// 		connStr = fmt.Sprintf(
// 			"postgresql://postgres.%s:%s@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require",
// 			projectRef, dbPassword)
// 		testConnection(connStr)

// 		// Try direct
// 		fmt.Println("Test 4: Direct connection...")
// 		connStr = fmt.Sprintf(
// 			"host=db.%s.supabase.co port=5432 user=postgres password=%s dbname=postgres sslmode=require",
// 			projectRef, dbPassword)
// 		testConnection(connStr)
// 	}

// 	fmt.Println()
// 	fmt.Println("=== All tests failed ===")
// 	fmt.Println("Next steps:")
// 	fmt.Println("1. Get connection string from Supabase dashboard")
// 	fmt.Println("2. Add DATABASE_URL to .env with exact string")
// 	fmt.Println("3. Run this test again")
// }

// func testConnection(connStr string) {
// 	maskedConn := maskPassword(connStr)
// 	fmt.Printf("   Trying: %s\n", maskedConn)

// 	db, err := sql.Open("postgres", connStr)
// 	if err != nil {
// 		fmt.Printf("   ❌ Open failed: %v\n", err)
// 		return
// 	}
// 	defer db.Close()

// 	err = db.Ping()
// 	if err != nil {
// 		fmt.Printf("   ❌ Ping failed: %v\n", err)
// 	} else {
// 		fmt.Println("   ✅ SUCCESS!")
// 		os.Exit(0)
// 	}
// }

// func extractProjectRef(url string) string {
// 	// Extract from https://xxxxx.supabase.co
// 	url = url[8:] // Remove https://
// 	for i, ch := range url {
// 		if ch == '.' {
// 			return url[:i]
// 		}
// 	}
// 	return ""
// }

// func maskPassword(s string) string {
// 	// Mask password in connection string
// 	start := -1
// 	end := -1

// 	for i := 0; i < len(s)-1; i++ {
// 		if s[i] == ':' && start == -1 {
// 			// Look for second colon (after username)
// 			secondColon := false
// 			for j := 0; j < i; j++ {
// 				if s[j] == ':' {
// 					secondColon = true
// 					break
// 				}
// 			}
// 			if secondColon {
// 				start = i + 1
// 			}
// 		}
// 		if s[i] == '@' && start != -1 {
// 			end = i
// 			break
// 		}
// 	}

// 	if start != -1 && end != -1 {
// 		return s[:start] + "***PASSWORD***" + s[end:]
// 	}
// 	return s
// }

// func containsSpecialChars(s string) bool {
// 	specialChars := "@#$%^&*()+=[]{}|;:,<>?/~`"
// 	for _, ch := range s {
// 		for _, special := range specialChars {
// 			if ch == special {
// 				return true
// 			}
// 		}
// 	}
// 	return false
// }
