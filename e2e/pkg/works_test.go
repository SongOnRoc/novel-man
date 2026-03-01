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

func TestRunWorksTestsWithMockServer(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var response StandardResponse
		if r.Method == "PUT" {
			var updateReq UpdateWorkRequest
			json.NewDecoder(r.Body).Decode(&updateReq)
			response = StandardResponse{
				Data: WorkResponse{ID: 1, Title: updateReq.Title, Status: updateReq.Status},
			}
			w.WriteHeader(http.StatusOK)
		} else if r.Method == "POST" {
			response = StandardResponse{Data: WorkResponse{ID: 1}}
			w.WriteHeader(http.StatusCreated)
		} else if r.Method == "DELETE" {
			w.WriteHeader(http.StatusOK)
		} else {
			response = StandardResponse{Data: WorkResponse{ID: 1}}
			w.WriteHeader(http.StatusOK)
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	ctx := &TestContext{
		Logger:   log.New(os.Stdout, "[TEST] ", log.LstdFlags),
		Token:    "mock_token",
		BaseURL:  server.URL,
	}

	Convey("Works Test Runner with Mock Server", t, func() {
		// This is a simplified test; it doesn't panic on failure.
		// A full test would require more complex logic to inspect panics.
		So(func() { RunWorksTests(ctx) }, ShouldNotPanic)
	})
}