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

func TestRunDraftsTestsWithMockServer(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/works" && r.Method == "POST" {
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(StandardResponse{Data: WorkResponse{ID: 1}})
			return
		}
		if r.URL.Path == "/drafts" && r.Method == "POST" {
			w.WriteHeader(http.StatusCreated)
		} else if r.Method == "DELETE" {
			w.WriteHeader(http.StatusOK) // Match real server behavior
		} else {
			w.WriteHeader(http.StatusOK)
		}
		response := StandardResponse{
			Code:    0,
			Message: "Success",
			Data:    DraftResponse{ID: 1, Title: "Test Draft"},
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	ctx := &TestContext{
		Logger:   log.New(os.Stdout, "[TEST] ", log.LstdFlags),
		Token:    "mock_token",
		BaseURL:  server.URL,
	}

	Convey("Drafts Test Runner with Mock Server", t, func() {
		So(func() { RunDraftsTests(ctx) }, ShouldNotPanic)
	})
}