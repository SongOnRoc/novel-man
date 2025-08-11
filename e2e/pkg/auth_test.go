package pkg

import (
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	. "github.com/smartystreets/goconvey/convey"
)

func TestSetupWithMockServer(t *testing.T) {
	// Create a mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/auth/register":
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(StandardResponse{
				Code:    0,
				Message: "User created",
			})
		case "/api/v1/auth/login":
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(StandardResponse{
				Code:    0,
				Message: "Login successful",
				Data: LoginResponse{
					AccessToken: "mock_token",
					TokenType:   "bearer",
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	// Override the BASE_URL to point to our mock server
	originalBaseURL := BASE_URL
	BASE_URL = server.URL + "/api/v1"
	defer func() { BASE_URL = originalBaseURL }()

	Convey("Setup Function with Mock Server", t, func() {
		Convey("Should successfully get a token", func() {
			logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
			token, err := Setup(logger)
			So(err, ShouldBeNil)
			So(token, ShouldEqual, "mock_token")
		})
	})
}