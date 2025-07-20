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

func TestChaptersAPI(t *testing.T) {
	token, err := os.ReadFile(".jwt_token")
	if err != nil {
		t.Skip("Skipping chapters test, no token")
	}
	jwtToken = string(token)

	var workID1, workID2 int64

	Convey("Setup: Create Two Works for Chapter Tests", t, func() {
		// Create first work
		createWorkBody1 := map[string]string{"title": "Test Work 1", "status": "ongoing"}
		jsonBody1, _ := json.Marshal(createWorkBody1)
		req1, _ := http.NewRequest("POST", BASE_URL+"/works", bytes.NewBuffer(jsonBody1))
		req1.Header.Set("Content-Type", "application/json")
		req1.Header.Set("Authorization", "Bearer "+jwtToken)
		client := &http.Client{}
		resp1, err := client.Do(req1)
		So(err, ShouldBeNil)
		So(resp1.StatusCode, ShouldEqual, http.StatusCreated)
		var createWorkResponse1 map[string]map[string]interface{}
		err = json.NewDecoder(resp1.Body).Decode(&createWorkResponse1)
		So(err, ShouldBeNil)
		workID1 = int64(createWorkResponse1["data"]["id"].(float64))
		So(workID1, ShouldBeGreaterThan, 0)

		// Create second work
		createWorkBody2 := map[string]string{"title": "Test Work 2", "status": "ongoing"}
		jsonBody2, _ := json.Marshal(createWorkBody2)
		req2, _ := http.NewRequest("POST", BASE_URL+"/works", bytes.NewBuffer(jsonBody2))
		req2.Header.Set("Content-Type", "application/json")
		req2.Header.Set("Authorization", "Bearer "+jwtToken)
		resp2, err := client.Do(req2)
		So(err, ShouldBeNil)
		So(resp2.StatusCode, ShouldEqual, http.StatusCreated)
		var createWorkResponse2 map[string]map[string]interface{}
		err = json.NewDecoder(resp2.Body).Decode(&createWorkResponse2)
		So(err, ShouldBeNil)
		workID2 = int64(createWorkResponse2["data"]["id"].(float64))
		So(workID2, ShouldBeGreaterThan, 0)
		time.Sleep(200 * time.Millisecond) // Increase delay for DB write
	})

	Convey("Chapters CRUD for Multiple Works", t, func() {
		var chapterID1, chapterID2 int64

		Convey("Create Chapters for Each Work", func() {
			// Create chapter for work 1
			createChapterBody1 := map[string]interface{}{"title": "Chapter 1 for Work 1", "content": "Content 1", "work_id": workID1}
			jsonBody1, _ := json.Marshal(createChapterBody1)
			req1, _ := http.NewRequest("POST", BASE_URL+"/chapters", bytes.NewBuffer(jsonBody1))
			req1.Header.Set("Content-Type", "application/json")
			req1.Header.Set("Authorization", "Bearer "+jwtToken)
			client := &http.Client{}
			resp1, err := client.Do(req1)
			So(err, ShouldBeNil)
			So(resp1.StatusCode, ShouldEqual, http.StatusCreated)
			var createChapterResponse1 map[string]map[string]interface{}
			err = json.NewDecoder(resp1.Body).Decode(&createChapterResponse1)
			So(err, ShouldBeNil)
			chapterID1 = int64(createChapterResponse1["data"]["id"].(float64))

			// Create chapter for work 2
			createChapterBody2 := map[string]interface{}{"title": "Chapter 1 for Work 2", "content": "Content 2", "work_id": workID2}
			jsonBody2, _ := json.Marshal(createChapterBody2)
			req2, _ := http.NewRequest("POST", BASE_URL+"/chapters", bytes.NewBuffer(jsonBody2))
			req2.Header.Set("Content-Type", "application/json")
			req2.Header.Set("Authorization", "Bearer "+jwtToken)
			resp2, err := client.Do(req2)
			So(err, ShouldBeNil)
			So(resp2.StatusCode, ShouldEqual, http.StatusCreated)
			var createChapterResponse2 map[string]map[string]interface{}
			err = json.NewDecoder(resp2.Body).Decode(&createChapterResponse2)
			So(err, ShouldBeNil)
			chapterID2 = int64(createChapterResponse2["data"]["id"].(float64))
		})

		Convey("Get Chapters", func() {
			// Get chapter 1
			req1, _ := http.NewRequest("GET", fmt.Sprintf("%s/chapters/%d", BASE_URL, chapterID1), nil)
			req1.Header.Set("Authorization", "Bearer "+jwtToken)
			client := &http.Client{}
			resp1, err := client.Do(req1)
			So(err, ShouldBeNil)
			So(resp1.StatusCode, ShouldEqual, http.StatusOK)

			// Get chapter 2
			req2, _ := http.NewRequest("GET", fmt.Sprintf("%s/chapters/%d", BASE_URL, chapterID2), nil)
			req2.Header.Set("Authorization", "Bearer "+jwtToken)
			resp2, err := client.Do(req2)
			So(err, ShouldBeNil)
			So(resp2.StatusCode, ShouldEqual, http.StatusOK)
		})

		Convey("Update Chapters", func() {
			// Update chapter 1
			updateChapterBody1 := map[string]string{"title": "Updated Chapter 1"}
			jsonBody1, _ := json.Marshal(updateChapterBody1)
			req1, _ := http.NewRequest("PUT", fmt.Sprintf("%s/chapters/%d", BASE_URL, chapterID1), bytes.NewBuffer(jsonBody1))
			req1.Header.Set("Content-Type", "application/json")
			req1.Header.Set("Authorization", "Bearer "+jwtToken)
			client := &http.Client{}
			resp1, err := client.Do(req1)
			So(err, ShouldBeNil)
			So(resp1.StatusCode, ShouldEqual, http.StatusOK)

			// Update chapter 2
			updateChapterBody2 := map[string]string{"title": "Updated Chapter 2"}
			jsonBody2, _ := json.Marshal(updateChapterBody2)
			req2, _ := http.NewRequest("PUT", fmt.Sprintf("%s/chapters/%d", BASE_URL, chapterID2), bytes.NewBuffer(jsonBody2))
			req2.Header.Set("Content-Type", "application/json")
			req2.Header.Set("Authorization", "Bearer "+jwtToken)
			resp2, err := client.Do(req2)
			So(err, ShouldBeNil)
			So(resp2.StatusCode, ShouldEqual, http.StatusOK)
		})

		Convey("Delete Chapters", func() {
			// Delete chapter 1
			req1, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/chapters/%d", BASE_URL, chapterID1), nil)
			req1.Header.Set("Authorization", "Bearer "+jwtToken)
			client := &http.Client{}
			resp1, err := client.Do(req1)
			So(err, ShouldBeNil)
			So(resp1.StatusCode, ShouldEqual, http.StatusNoContent)

			// Delete chapter 2
			req2, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/chapters/%d", BASE_URL, chapterID2), nil)
			req2.Header.Set("Authorization", "Bearer "+jwtToken)
			resp2, err := client.Do(req2)
			So(err, ShouldBeNil)
			So(resp2.StatusCode, ShouldEqual, http.StatusNoContent)
		})
	})

	Convey("Teardown: Delete the Works", t, func() {
		// Delete first work
		req1, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/works/%d", BASE_URL, workID1), nil)
		req1.Header.Set("Authorization", "Bearer "+jwtToken)
		client := &http.Client{}
		resp1, err := client.Do(req1)
		So(err, ShouldBeNil)
		So(resp1.StatusCode, ShouldEqual, http.StatusNoContent)

		// Delete second work
		req2, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/works/%d", BASE_URL, workID2), nil)
		req2.Header.Set("Authorization", "Bearer "+jwtToken)
		resp2, err := client.Do(req2)
		So(err, ShouldBeNil)
		So(resp2.StatusCode, ShouldEqual, http.StatusNoContent)
	})
}
