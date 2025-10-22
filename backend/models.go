package main

import "time"

// Workspace represents a saved browser workspace
type Workspace struct {
	ID             int64      `json:"id"`
	UserID         string     `json:"user_id"`
	Name           string     `json:"name"`
	Description    *string    `json:"description,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	LastAccessedAt *time.Time `json:"last_accessed_at,omitempty"`
	Tabs           []Tab      `json:"tabs,omitempty"`
}

// Tab represents a browser tab within a workspace
type Tab struct {
	ID          int64   `json:"id"`
	WorkspaceID int64   `json:"workspace_id"`
	URL         string  `json:"url"`
	Title       *string `json:"title,omitempty"`
	FaviconURL  *string `json:"favicon_url,omitempty"`
	Position    int     `json:"position"`
}

// Group represents a collection of workspaces
type Group struct {
	ID        int64     `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateWorkspaceRequest is the request body for creating a workspace
type CreateWorkspaceRequest struct {
	Name        string              `json:"name"`
	Description *string             `json:"description,omitempty"`
	Tabs        []CreateTabRequest  `json:"tabs"`
}

// CreateTabRequest is the request body for creating a tab
type CreateTabRequest struct {
	URL        string  `json:"url"`
	Title      *string `json:"title,omitempty"`
	FaviconURL *string `json:"favicon_url,omitempty"`
	Position   int     `json:"position"`
}

// UpdateWorkspaceRequest is the request body for updating a workspace
type UpdateWorkspaceRequest struct {
	Name           *string    `json:"name,omitempty"`
	Description    *string    `json:"description,omitempty"`
	LastAccessedAt *time.Time `json:"last_accessed_at,omitempty"`
}

// CreateGroupRequest is the request body for creating a group
type CreateGroupRequest struct {
	Name  string  `json:"name"`
	Color *string `json:"color,omitempty"`
}

// ErrorResponse is a standard error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

// SuccessResponse is a standard success response
type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}
