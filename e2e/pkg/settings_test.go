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

func TestRunSettingsTestsWithMockServer(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		response := StandardResponse{
			Code:    0,
			Message: "Success",
			Data:    SettingResponse{ID: 1, UserID: 1},
		}
		if r.URL.Path == "/auth/me" {
			response.Data = UserProfileResponse{ID: 1}
		}
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	ctx := &TestContext{
		Logger:   log.New(os.Stdout, "[TEST] ", log.LstdFlags),
		Token:    "mock_token",
		BaseURL:  server.URL,
	}

	Convey("Settings Test Runner with Mock Server", t, func() {
		So(func() { RunSettingsTests(ctx) }, ShouldNotPanic)
	})
}