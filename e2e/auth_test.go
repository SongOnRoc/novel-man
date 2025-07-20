package main_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
	"testing"

	. "github.com/smartystreets/goconvey/convey"
)

func TestAuthAPI(t *testing.T) {
	Convey("Authentication Endpoints", t, func() {
		// Register a fixed user, ignore conflict if already exists
		registerBody := map[string]string{
			"username": "e2euser",
			"password": "password",
			"email":    "e2e@example.com",
		}
		jsonBody, _ := json.Marshal(registerBody)
		resp, err := http.Post(BASE_URL+"/auth/register", "application/json", bytes.NewBuffer(jsonBody))
		So(err, ShouldBeNil)
		So(resp.StatusCode, ShouldBeIn, http.StatusCreated, http.StatusConflict)

		// Login to get the token
		loginBody := map[string]string{
			"identifier": "e2euser",
			"password":   "password",
		}
		jsonBody, _ = json.Marshal(loginBody)
		resp, err = http.Post(BASE_URL+"/auth/login", "application/json", bytes.NewBuffer(jsonBody))
		So(err, ShouldBeNil)
		So(resp.StatusCode, ShouldEqual, http.StatusOK)

		var loginResponse map[string]string
		json.NewDecoder(resp.Body).Decode(&loginResponse)
		jwtToken := loginResponse["access_token"]
		So(jwtToken, ShouldNotBeEmpty)

		// Persist the token to a file
		err = os.WriteFile(".jwt_token", []byte(jwtToken), 0644)
		So(err, ShouldBeNil)
	})
}