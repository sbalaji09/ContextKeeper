package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

// GroupHandler handles group-related requests
type GroupHandler struct {
	DB *SupabaseClient
}

// CreateGroup creates a new group
func (h *GroupHandler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r)
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized", "User ID not found")
		return
	}

	var req CreateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Bad Request", "Invalid request body")
		return
	}

	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Bad Request", "Group name is required")
		return
	}

	color := "#3b82f6"
	if req.Color != nil {
		color = *req.Color
	}

	groupData := map[string]interface{}{
		"user_id":    userID,
		"name":       req.Name,
		"color":      color,
		"created_at": time.Now(),
	}

	groupJSON, err := h.DB.Insert("groups", groupData)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database Error", "Failed to create group")
		return
	}

	var groups []Group
	if err := json.Unmarshal(groupJSON, &groups); err != nil || len(groups) == 0 {
		respondError(w, http.StatusInternalServerError, "Server Error", "Failed to parse group response")
		return
	}

	respondSuccess(w, http.StatusCreated, groups[0])
}

// GetGroups retrieves all groups for the authenticated user
func (h *GroupHandler) GetGroups(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r)
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized", "User ID not found")
		return
	}

	groupsJSON, err := h.DB.Select("groups", "*", fmt.Sprintf("user_id=eq.%s&order=created_at.desc", userID))
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database Error", "Failed to fetch groups")
		return
	}

	var groups []Group
	if err := json.Unmarshal(groupsJSON, &groups); err != nil {
		respondError(w, http.StatusInternalServerError, "Server Error", "Failed to parse groups")
		return
	}

	respondSuccess(w, http.StatusOK, groups)
}

// DeleteGroup deletes a group
func (h *GroupHandler) DeleteGroup(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r)
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized", "User ID not found")
		return
	}

	vars := mux.Vars(r)
	id := vars["id"]

	err := h.DB.Delete("groups", fmt.Sprintf("id=eq.%s&user_id=eq.%s", id, userID))
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database Error", "Failed to delete group")
		return
	}

	respondSuccessMessage(w, http.StatusOK, "Group deleted successfully")
}
