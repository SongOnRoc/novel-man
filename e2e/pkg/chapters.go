package pkg

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// RunChaptersTests executes the CRUD lifecycle for the /chapters endpoint.
func RunChaptersTests(ctx *TestContext) {
	ctx.Logger.Println("--- Running Chapters Tests ---")

	// Setup: Create a work to associate chapters with.
	ctx.Logger.Println("Setup: Creating a work for chapters...")
	workID := createWorkForTest(ctx, "Work for Chapters")
	defer deleteWorkForTest(ctx, workID) // Teardown

	var chapterID uint

	// 1. Create
	func() {
		ctx.Logger.Println("Step 1: Creating a new chapter...")
		createBody := CreateChapterRequest{
			Title:  "A New Chapter",
			WorkID: workID,
		}
		jsonBody, err := json.Marshal(createBody)
		if err != nil {
			ctx.Logger.Fatalf("Create chapter failed: could not marshal request: %v", err)
		}

		req, _ := http.NewRequest("POST", ctx.BaseURL+"/chapters", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+ctx.Token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Create chapter failed: request error: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			ctx.Logger.Fatalf("Create chapter failed: expected status 201, got %d", resp.StatusCode)
		}

		var createResponse StandardResponse
		var chapterData ChapterResponse
		if err := json.NewDecoder(resp.Body).Decode(&createResponse); err != nil {
			ctx.Logger.Fatalf("Create chapter failed: could not decode response: %v", err)
		}
		dataBytes, _ := json.Marshal(createResponse.Data)
		json.Unmarshal(dataBytes, &chapterData)

		if chapterData.ID == 0 {
			ctx.Logger.Fatalf("Create chapter failed: chapter ID is 0")
		}
		chapterID = chapterData.ID
		fmt.Println("✓ Chapter created successfully")
	}()

	// 2. Get
	func() {
		ctx.Logger.Printf("Step 2: Getting chapter with ID %d...", chapterID)
		req, _ := http.NewRequest("GET", fmt.Sprintf("%s/chapters/%d", ctx.BaseURL, chapterID), nil)
		req.Header.Set("Authorization", "Bearer "+ctx.Token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Get chapter failed: request error: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			ctx.Logger.Fatalf("Get chapter failed: expected status 200, got %d", resp.StatusCode)
		}
		fmt.Println("✓ Chapter retrieved successfully")
	}()

	// 3. Update
	func() {
		ctx.Logger.Printf("Step 3: Updating chapter with ID %d...", chapterID)
		updateBody := UpdateChapterRequest{
			Title: "Updated Chapter Title",
		}
		jsonBody, err := json.Marshal(updateBody)
		if err != nil {
			ctx.Logger.Fatalf("Update chapter failed: could not marshal request: %v", err)
		}

		req, _ := http.NewRequest("PUT", fmt.Sprintf("%s/chapters/%d", ctx.BaseURL, chapterID), bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+ctx.Token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Update chapter failed: request error: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			ctx.Logger.Fatalf("Update chapter failed: expected status 200, got %d", resp.StatusCode)
		}
		fmt.Println("✓ Chapter updated successfully")
	}()

	// 4. List
	func() {
		ctx.Logger.Printf("Step 4: Listing chapters for work ID %d...", workID)
		req, _ := http.NewRequest("GET", fmt.Sprintf("%s/chapters?work_id=%d", ctx.BaseURL, workID), nil)
		req.Header.Set("Authorization", "Bearer "+ctx.Token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("List failed: request error: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			ctx.Logger.Fatalf("List failed: expected status 200, got %d", resp.StatusCode)
		}
		fmt.Println("✓ Chapters listed successfully")
	}()

	// 5. Delete
	func() {
		ctx.Logger.Printf("Step 5: Deleting chapter with ID %d...", chapterID)
		req, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/chapters/%d", ctx.BaseURL, chapterID), nil)
		req.Header.Set("Authorization", "Bearer "+ctx.Token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Delete chapter failed: request error: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK { // Adjusted to expect 200 OK
			ctx.Logger.Fatalf("Delete chapter failed: expected status 200, got %d", resp.StatusCode)
		}
		fmt.Println("✓ Chapter deleted successfully")
	}()

	ctx.Logger.Println("--- Chapters Tests Passed ---")
}

// Helper function to create a work for chapter tests
func createWorkForTest(ctx *TestContext, title string) uint {
	createBody := CreateWorkRequest{Title: title, Status: "ongoing"}
	jsonBody, _ := json.Marshal(createBody)
	req, _ := http.NewRequest("POST", ctx.BaseURL+"/works", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+ctx.Token)
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusCreated {
		ctx.Logger.Fatalf("Failed to create work for chapter test: %v", err)
	}
	defer resp.Body.Close()
	var createResponse StandardResponse
	var workData WorkResponse
	json.NewDecoder(resp.Body).Decode(&createResponse)
	dataBytes, _ := json.Marshal(createResponse.Data)
	json.Unmarshal(dataBytes, &workData)
	return workData.ID
}

// Helper function to delete a work after chapter tests
func deleteWorkForTest(ctx *TestContext, workID uint) {
	req, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/works/%d", ctx.BaseURL, workID), nil)
	req.Header.Set("Authorization", "Bearer "+ctx.Token)
	client := &http.Client{}
	client.Do(req)
}
