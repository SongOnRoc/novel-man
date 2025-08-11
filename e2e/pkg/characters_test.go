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

func TestRunCharactersTestsWithMockServer(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			w.WriteHeader(http.StatusCreated)
		} else if r.Method == "DELETE" {
			w.WriteHeader(http.StatusOK) // Match real server behavior
		} else {
			w.WriteHeader(http.StatusOK)
		}
		response := StandardResponse{
			Code:    0,
			Message: "Success",
			Data:    CharacterResponse{ID: 1, Name: "Test Character"},
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	ctx := &TestContext{
		Logger:   log.New(os.Stdout, "[TEST] ", log.LstdFlags),
		Token:    "mock_token",
		BaseURL:  server.URL,
	}

	Convey("Characters Test Runner with Mock Server", t, func() {
		So(func() { RunCharactersTests(ctx) }, ShouldNotPanic)
	})
}