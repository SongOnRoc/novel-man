package pkg

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

var (
	BASE_URL = "http://localhost:8080/api/v1"
)

// TestContext holds shared data for tests, like the auth token.
type TestContext struct {
	Logger  *log.Logger
	Token   string
	BaseURL string
}

// Setup performs user registration and login to get a token for tests.
func Setup(logger *log.Logger) (string, error) {
	logger.Println("Registering user 'e2euser'...")
	registerBody := RegisterRequest{
		Username: "e2euser",
		Password: "password",
		Email:    "e2e@example.com",
	}
	jsonBody, err := json.Marshal(registerBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal register request: %w", err)
	}

	resp, err := http.Post(BASE_URL+"/auth/register", "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to send register request: %w", err)
	}
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusConflict {
		return "", fmt.Errorf("unexpected status code on register: got %v", resp.StatusCode)
	}
	resp.Body.Close()
	logger.Println("Registration successful or user already exists.")

	logger.Println("Logging in to get auth token...")
	loginBody := LoginRequest{
		Identifier: "e2euser",
		Password:   "password",
	}
	jsonBody, err = json.Marshal(loginBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal login request: %w", err)
	}

	resp, err = http.Post(BASE_URL+"/auth/login", "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to send login request: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to login, status code: %v", resp.StatusCode)
	}
	defer resp.Body.Close()

	var loginResponseWrapper StandardResponse
	if err := json.NewDecoder(resp.Body).Decode(&loginResponseWrapper); err != nil {
		return "", fmt.Errorf("failed to decode login response wrapper: %w", err)
	}

	dataBytes, err := json.Marshal(loginResponseWrapper.Data)
	if err != nil {
		return "", fmt.Errorf("failed to marshal login response data: %w", err)
	}

	var loginData LoginResponse
	if err := json.Unmarshal(dataBytes, &loginData); err != nil {
		return "", fmt.Errorf("failed to unmarshal login response data: %w", err)
	}

	if loginData.AccessToken == "" {
		return "", fmt.Errorf("login successful, but access token is empty")
	}

	logger.Println("Token obtained successfully.")
	return loginData.AccessToken, nil
}
