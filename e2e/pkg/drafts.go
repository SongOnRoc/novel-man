package pkg

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// RunDraftsTests executes the full CRUD lifecycle for the /drafts endpoint.
func RunDraftsTests(ctx *TestContext) {
	ctx.Logger.Println("--- Running Drafts Tests ---")
	var draftID uint

	// Setup: Create a work to associate drafts with.
	workID := createWorkForTest(ctx, "Work for Drafts")
	defer deleteWorkForTest(ctx, workID)

	// 1. Create
	func() {
		ctx.Logger.Println("Step 1: Creating a new draft...")
		createBody := CreateDraftRequest{
			Title:  "E2E Test Draft",
			WorkID: workID,
		}
		jsonBody, err := json.Marshal(createBody)
		if err != nil {
			ctx.Logger.Fatalf("Create failed: could not marshal request: %v", err)
		}

		req, _ := http.NewRequest("POST", ctx.BaseURL+"/drafts", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+ctx.Token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Create failed: request error: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			ctx.Logger.Fatalf("Create failed: expected status 201, got %d", resp.StatusCode)
		}

		var createResponse StandardResponse
		var draftData DraftResponse
		if err := json.NewDecoder(resp.Body).Decode(&createResponse); err != nil {
			ctx.Logger.Fatalf("Create failed: could not decode response: %v", err)
		}
		dataBytes, _ := json.Marshal(createResponse.Data)
		json.Unmarshal(dataBytes, &draftData)

		if draftData.ID == 0 {
			ctx.Logger.Fatalf("Create failed: draft ID is 0")
		}
		draftID = draftData.ID
		fmt.Println("✓ Draft created successfully")
	}()

	// 2. Get
	func() {
		ctx.Logger.Printf("Step 2: Getting draft with ID %d...", draftID)
		req, _ := http.NewRequest("GET", fmt.Sprintf("%s/drafts/%d", ctx.BaseURL, draftID), nil)
		req.Header.Set("Authorization", "Bearer "+ctx.Token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Get failed: request error: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			ctx.Logger.Fatalf("Get failed: expected status 200, got %d", resp.StatusCode)
		}
		fmt.Println("✓ Draft retrieved successfully")
	}()

	// 3. Update
	func() {
		ctx.Logger.Printf("Step 3: Updating draft with ID %d...", draftID)
		updateBody := UpdateDraftRequest{
			Title: "Updated E2E Draft",
		}
		jsonBody, err := json.Marshal(updateBody)
		if err != nil {
			ctx.Logger.Fatalf("Update failed: could not marshal request: %v", err)
		}

		req, _ := http.NewRequest("PUT", fmt.Sprintf("%s/drafts/%d", ctx.BaseURL, draftID), bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+ctx.Token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Update failed: request error: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			ctx.Logger.Fatalf("Update failed: expected status 200, got %d", resp.StatusCode)
		}
		fmt.Println("✓ Draft updated successfully")
	}()

	// 4. List
	func() {
		ctx.Logger.Printf("Step 4: Listing drafts for work ID %d...", workID)
		req, _ := http.NewRequest("GET", fmt.Sprintf("%s/drafts?work_id=%d", ctx.BaseURL, workID), nil)
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
		fmt.Println("✓ Drafts listed successfully")
	}()

	// 5. Delete
	func() {
		ctx.Logger.Printf("Step 5: Deleting draft with ID %d...", draftID)
		req, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/drafts/%d", ctx.BaseURL, draftID), nil)
		req.Header.Set("Authorization", "Bearer "+ctx.Token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Delete failed: request error: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK { // Adjusted to expect 200 OK
			ctx.Logger.Fatalf("Delete failed: expected status 200, got %d", resp.StatusCode)
		}
		fmt.Println("✓ Draft deleted successfully")
	}()

	// 6. Publish
	func() {
		// Re-create a draft to publish it
		draftToPublishID := createDraftForTest(ctx, workID, "Draft to Publish")

		ctx.Logger.Printf("Step 6: Publishing draft with ID %d...", draftToPublishID)
		req, _ := http.NewRequest("POST", fmt.Sprintf("%s/drafts/%d/publish", ctx.BaseURL, draftToPublishID), nil)
		req.Header.Set("Authorization", "Bearer "+ctx.Token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Publish failed: request error: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			ctx.Logger.Fatalf("Publish failed: expected status 200, got %d", resp.StatusCode)
		}
		fmt.Println("✓ Draft published successfully")
	}()

	ctx.Logger.Println("--- Drafts Tests Passed ---")
}

// Helper function to create a draft for tests
func createDraftForTest(ctx *TestContext, workID uint, title string) uint {
	createBody := CreateDraftRequest{WorkID: workID, Title: title}
	jsonBody, _ := json.Marshal(createBody)
	req, _ := http.NewRequest("POST", ctx.BaseURL+"/drafts", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+ctx.Token)
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusCreated {
		ctx.Logger.Fatalf("Failed to create draft for test: %v", err)
	}
	defer resp.Body.Close()
	var createResponse StandardResponse
	var draftData DraftResponse
	json.NewDecoder(resp.Body).Decode(&createResponse)
	dataBytes, _ := json.Marshal(createResponse.Data)
	json.Unmarshal(dataBytes, &draftData)
	return draftData.ID
}