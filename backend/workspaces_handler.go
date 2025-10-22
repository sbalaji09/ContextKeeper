package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

// WorkspaceHandler handles workspace-related requests
type WorkspaceHandler struct {
	DB *SupabaseClient
}

// CreateWorkspace creates a new workspace with tabs
func (h *WorkspaceHandler) CreateWorkspace(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r)
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized", "User ID not found")
		return
	}

	var req CreateWorkspaceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Bad Request", "Invalid request body")
		return
	}

	// Validate
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Bad Request", "Workspace name is required")
		return
	}
	if len(req.Tabs) == 0 {
		respondError(w, http.StatusBadRequest, "Bad Request", "At least one tab is required")
		return
	}

	// Create workspace
	now := time.Now()
	workspaceData := map[string]interface{}{
		"user_id":     userID,
		"name":        req.Name,
		"description": req.Description,
		"created_at":  now,
		"updated_at":  now,
	}

	workspaceJSON, err := h.DB.Insert("workspaces", workspaceData)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database Error", "Failed to create workspace")
		return
	}

	var workspaces []Workspace
	if err := json.Unmarshal(workspaceJSON, &workspaces); err != nil || len(workspaces) == 0 {
		respondError(w, http.StatusInternalServerError, "Server Error", "Failed to parse workspace response")
		return
	}
	workspace := workspaces[0]

	// Create tabs
	tabs := make([]Tab, 0, len(req.Tabs))
	for _, tabReq := range req.Tabs {
		tabData := map[string]interface{}{
			"workspace_id": workspace.ID,
			"url":          tabReq.URL,
			"title":        tabReq.Title,
			"favicon_url":  tabReq.FaviconURL,
			"position":     tabReq.Position,
		}

		tabJSON, err := h.DB.Insert("tabs", tabData)
		if err != nil {
			// Rollback: delete workspace
			h.DB.Delete("workspaces", fmt.Sprintf("id=eq.%d", workspace.ID))
			respondError(w, http.StatusInternalServerError, "Database Error", "Failed to create tabs")
			return
		}

		var insertedTabs []Tab
		if err := json.Unmarshal(tabJSON, &insertedTabs); err == nil && len(insertedTabs) > 0 {
			tabs = append(tabs, insertedTabs[0])
		}
	}

	workspace.Tabs = tabs

	respondSuccess(w, http.StatusCreated, workspace)
}

// GetWorkspaces retrieves all workspaces for the authenticated user
func (h *WorkspaceHandler) GetWorkspaces(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r)
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized", "User ID not found")
		return
	}

	// Get workspaces
	workspacesJSON, err := h.DB.Select("workspaces", "*", fmt.Sprintf("user_id=eq.%s&order=created_at.desc", userID))
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database Error", "Failed to fetch workspaces")
		return
	}

	var workspaces []Workspace
	if err := json.Unmarshal(workspacesJSON, &workspaces); err != nil {
		respondError(w, http.StatusInternalServerError, "Server Error", "Failed to parse workspaces")
		return
	}

	// Get tabs for each workspace
	for i := range workspaces {
		tabsJSON, err := h.DB.Select("tabs", "*", fmt.Sprintf("workspace_id=eq.%d&order=position.asc", workspaces[i].ID))
		if err == nil {
			var tabs []Tab
			if err := json.Unmarshal(tabsJSON, &tabs); err == nil {
				workspaces[i].Tabs = tabs
			}
		}
	}

	respondSuccess(w, http.StatusOK, workspaces)
}

// GetWorkspace retrieves a specific workspace by ID
func (h *WorkspaceHandler) GetWorkspace(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r)
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized", "User ID not found")
		return
	}

	vars := mux.Vars(r)
	id := vars["id"]

	workspaceJSON, err := h.DB.Select("workspaces", "*", fmt.Sprintf("id=eq.%s&user_id=eq.%s", id, userID))
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database Error", "Failed to fetch workspace")
		return
	}

	var workspaces []Workspace
	if err := json.Unmarshal(workspaceJSON, &workspaces); err != nil || len(workspaces) == 0 {
		respondError(w, http.StatusNotFound, "Not Found", "Workspace not found")
		return
	}
	workspace := workspaces[0]

	// Get tabs
	tabsJSON, err := h.DB.Select("tabs", "*", fmt.Sprintf("workspace_id=eq.%s&order=position.asc", id))
	if err == nil {
		var tabs []Tab
		if err := json.Unmarshal(tabsJSON, &tabs); err == nil {
			workspace.Tabs = tabs
		}
	}

	respondSuccess(w, http.StatusOK, workspace)
}

// UpdateWorkspace updates a workspace
func (h *WorkspaceHandler) UpdateWorkspace(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r)
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized", "User ID not found")
		return
	}

	vars := mux.Vars(r)
	id := vars["id"]

	var req UpdateWorkspaceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Bad Request", "Invalid request body")
		return
	}

	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.LastAccessedAt != nil {
		updates["last_accessed_at"] = *req.LastAccessedAt
	}

	workspaceJSON, err := h.DB.Update("workspaces", fmt.Sprintf("id=eq.%s&user_id=eq.%s", id, userID), updates)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database Error", "Failed to update workspace")
		return
	}

	var workspaces []Workspace
	if err := json.Unmarshal(workspaceJSON, &workspaces); err != nil || len(workspaces) == 0 {
		respondError(w, http.StatusNotFound, "Not Found", "Workspace not found")
		return
	}

	respondSuccess(w, http.StatusOK, workspaces[0])
}

// DeleteWorkspace deletes a workspace and its tabs
func (h *WorkspaceHandler) DeleteWorkspace(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r)
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized", "User ID not found")
		return
	}

	vars := mux.Vars(r)
	id := vars["id"]

	err := h.DB.Delete("workspaces", fmt.Sprintf("id=eq.%s&user_id=eq.%s", id, userID))
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database Error", "Failed to delete workspace")
		return
	}

	respondSuccessMessage(w, http.StatusOK, "Workspace deleted successfully")
}

// Helper functions
func respondError(w http.ResponseWriter, status int, error, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{
		Error:   error,
		Message: message,
	})
}

func respondSuccess(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(SuccessResponse{
		Success: true,
		Data:    data,
	})
}

func respondSuccessMessage(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(SuccessResponse{
		Success: true,
		Message: message,
	})
}
