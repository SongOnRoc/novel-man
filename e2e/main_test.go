package main_test

import (
	"os"
	"testing"
)

const (
	BASE_URL = "http://localhost:8080/api/v1"
)

var jwtToken string

func TestMain(m *testing.M) {
	// Setup code here, if needed
	code := m.Run()
	// Teardown code here, if needed
	os.Exit(code)
}
