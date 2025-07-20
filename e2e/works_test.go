package main_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"testing"
	"time"

	. "github.com/smartystreets/goconvey/convey"
)

func TestWorksAPI(t *testing.T) {
	token, err := os.ReadFile(".jwt_token")
	if err != nil {
		t.Skip("Skipping works test, no token")
	}
	jwtToken = string(token)

	Convey("Works CRUD", t, func() {
		var workID int64

		Convey("Create", func() {
			createBody := map[string]string{
				"title":  "E2E Test Work",
				"status": "ongoing",
			}
			jsonBody, _ := json.Marshal(createBody)
			req, _ := http.NewRequest("POST", BASE_URL+"/works", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+jwtToken)
			client := &http.Client{}
			resp, err := client.Do(req)
			So(err, ShouldBeNil)
			So(resp.StatusCode, ShouldEqual, http.StatusCreated)

			var createResponse map[string]map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&createResponse)
			So(err, ShouldBeNil)
			t.Logf("Create response: %+v", createResponse)
			workID = int64(createResponse["data"]["id"].(float64))
			So(workID, ShouldBeGreaterThan, 0)
			time.Sleep(200 * time.Millisecond) // Increase delay for DB write
		})

		Convey("Get", func() {
			req, _ := http.NewRequest("GET", fmt.Sprintf("%s/works/%d", BASE_URL, workID), nil)
			req.Header.Set("Authorization", "Bearer "+jwtToken)
			client := &http.Client{}
			resp, err := client.Do(req)
			So(err, ShouldBeNil)
			So(resp.StatusCode, ShouldEqual, http.StatusOK)
			var getResponse map[string]map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&getResponse)
			So(err, ShouldBeNil)
			t.Logf("Get response: %+v", getResponse)
			So(int64(getResponse["data"]["id"].(float64)), ShouldEqual, workID)
		})

		Convey("Update", func() {
			updateBody := map[string]string{
				"title":  "Updated E2E Test Work",
				"status": "completed", // Add required status field
			}
			jsonBody, _ := json.Marshal(updateBody)
			req, _ := http.NewRequest("PUT", fmt.Sprintf("%s/works/%d", BASE_URL, workID), bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+jwtToken)
			client := &http.Client{}
			resp, err := client.Do(req)
			So(err, ShouldBeNil)
			So(resp.StatusCode, ShouldEqual, http.StatusOK)
			var updateResponse map[string]map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&updateResponse)
			So(err, ShouldBeNil)
			So(updateResponse["data"]["title"], ShouldEqual, "Updated E2E Test Work")
			So(updateResponse["data"]["status"], ShouldEqual, "completed")
		})

		Convey("Delete", func() {
			req, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/works/%d", BASE_URL, workID), nil)
			req.Header.Set("Authorization", "Bearer "+jwtToken)
			client := &http.Client{}
			resp, err := client.Do(req)
			So(err, ShouldBeNil)
			So(resp.StatusCode, ShouldEqual, http.StatusNoContent)
		})
	})
}
