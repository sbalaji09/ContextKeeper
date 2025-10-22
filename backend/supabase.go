package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// SupabaseClient represents a Supabase database client
type SupabaseClient struct {
	URL        string
	ServiceKey string
	HTTPClient *http.Client
}

// NewSupabaseClient creates a new Supabase client
func NewSupabaseClient(url, serviceKey string) *SupabaseClient {
	return &SupabaseClient{
		URL:        url,
		ServiceKey: serviceKey,
		HTTPClient: &http.Client{},
	}
}

// Query executes a SQL query (for advanced operations)
func (c *SupabaseClient) Query(table, query string, params map[string]interface{}) ([]byte, error) {
	url := fmt.Sprintf("%s/rest/v1/%s?%s", c.URL, table, query)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	c.setHeaders(req)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("query failed: %s", string(body))
	}

	return body, nil
}

// Insert inserts data into a table
func (c *SupabaseClient) Insert(table string, data interface{}) ([]byte, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("%s/rest/v1/%s", c.URL, table)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	c.setHeaders(req)
	req.Header.Set("Prefer", "return=representation")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("insert failed: %s", string(body))
	}

	return body, nil
}

// Select retrieves data from a table with filters
func (c *SupabaseClient) Select(table, columns, filters string) ([]byte, error) {
	url := fmt.Sprintf("%s/rest/v1/%s?select=%s", c.URL, table, columns)
	if filters != "" {
		url += "&" + filters
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	c.setHeaders(req)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("select failed: %s", string(body))
	}

	return body, nil
}

// Update updates data in a table
func (c *SupabaseClient) Update(table, filters string, data interface{}) ([]byte, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("%s/rest/v1/%s?%s", c.URL, table, filters)
	req, err := http.NewRequest("PATCH", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	c.setHeaders(req)
	req.Header.Set("Prefer", "return=representation")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("update failed: %s", string(body))
	}

	return body, nil
}

// Delete deletes data from a table
func (c *SupabaseClient) Delete(table, filters string) error {
	url := fmt.Sprintf("%s/rest/v1/%s?%s", c.URL, table, filters)
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return err
	}

	c.setHeaders(req)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete failed: %s", string(body))
	}

	return nil
}

// VerifyJWT verifies a Supabase JWT token and returns user ID
func (c *SupabaseClient) VerifyJWT(token string) (string, error) {
	url := fmt.Sprintf("%s/auth/v1/user", c.URL)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("apikey", c.ServiceKey)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("invalid token: %s", string(body))
	}

	var result struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	return result.ID, nil
}

// setHeaders sets common headers for Supabase requests
func (c *SupabaseClient) setHeaders(req *http.Request) {
	req.Header.Set("apikey", c.ServiceKey)
	req.Header.Set("Authorization", "Bearer "+c.ServiceKey)
	req.Header.Set("Content-Type", "application/json")
}
