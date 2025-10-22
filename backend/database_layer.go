package main

import (
	"fmt"
	"time"
)

// AddWorkspace inserts a new workspace and its tabs into the database
// Returns the workspace ID and error if any
func (handler *DatabaseHandler) AddWorkspace(userID string, name string, description *string, tabs []Tab) (int64, error) {
	// Start a transaction to ensure workspace and tabs are inserted together
	tx, err := handler.Db.Begin()
	if err != nil {
		return 0, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback() // Rollback if we don't commit

	// Insert workspace
	insertWorkspaceQuery := `
		INSERT INTO workspaces (
			user_id,
			name,
			description,
			created_at,
			updated_at
		) VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`

	now := time.Now()
	var workspaceID int64

	err = tx.QueryRow(
		insertWorkspaceQuery,
		userID,
		name,
		description,
		now,
		now,
	).Scan(&workspaceID)

	if err != nil {
		return 0, fmt.Errorf("failed to insert workspace: %w", err)
	}

	// Insert tabs for this workspace
	if len(tabs) > 0 {
		insertTabQuery := `
			INSERT INTO tabs (
				workspace_id,
				url,
				title,
				favicon_url,
				position,
				created_at
			) VALUES ($1, $2, $3, $4, $5, $6)
		`

		for _, tab := range tabs {
			_, err = tx.Exec(
				insertTabQuery,
				workspaceID,
				tab.URL,
				tab.Title,
				tab.FaviconURL,
				tab.Position,
				now,
			)

			if err != nil {
				return 0, fmt.Errorf("failed to insert tab: %w", err)
			}
		}
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return workspaceID, nil
}
