package pkg

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// RunRelationshipsTests executes the CRUD lifecycle for the /relationships endpoint.
func RunRelationshipsTests(ctx *TestContext) {
	ctx.Logger.Println("--- Running Relationships Tests ---")
	var relationshipID uint

	// Setup: Create a work and two characters to form a relationship.
	workID := createWorkForTest(ctx, "Work for Relationships")
	defer deleteWorkForTest(ctx, workID)
	char1ID := createCharacterForTest(ctx, "Character One")
	defer deleteCharacterForTest(ctx, char1ID)
	char2ID := createCharacterForTest(ctx, "Character Two")
	defer deleteCharacterForTest(ctx, char2ID)

	// 1. Create
	func() {
		ctx.Logger.Println("Step 1: Creating a new relationship...")
		createBody := RelationshipRequest{
			WorkID:           workID,
			SourceEntityType: "character",
			SourceEntityID:   char1ID,
			TargetEntityType: "character",
			TargetEntityID:   char2ID,
			RelationshipType: "ally",
		}
		jsonBody, err := json.Marshal(createBody)
		if err != nil {
			ctx.Logger.Fatalf("Create failed: could not marshal request: %v", err)
		}

		req, _ := http.NewRequest("POST", ctx.BaseURL+"/relationships", bytes.NewBuffer(jsonBody))
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
		var relData RelationshipResponse
		if err := json.NewDecoder(resp.Body).Decode(&createResponse); err != nil {
			ctx.Logger.Fatalf("Create failed: could not decode response: %v", err)
		}
		dataBytes, _ := json.Marshal(createResponse.Data)
		json.Unmarshal(dataBytes, &relData)

		if relData.ID == 0 {
			ctx.Logger.Fatalf("Create failed: relationship ID is 0")
		}
		relationshipID = relData.ID
		fmt.Println("✓ Relationship created successfully")
	}()

	// 2. Get
	func() {
		ctx.Logger.Printf("Step 2: Getting relationship with ID %d...", relationshipID)
		req, _ := http.NewRequest("GET", fmt.Sprintf("%s/relationships/%d", ctx.BaseURL, relationshipID), nil)
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
		fmt.Println("✓ Relationship retrieved successfully")
	}()

	// 3. Update
	func() {
		ctx.Logger.Printf("Step 3: Updating relationship with ID %d...", relationshipID)
		updateBody := RelationshipRequest{
			WorkID:           workID,
			SourceEntityType: "character",
			SourceEntityID:   char1ID,
			TargetEntityType: "character",
			TargetEntityID:   char2ID,
			RelationshipType: "enemy",
		}
		jsonBody, err := json.Marshal(updateBody)
		if err != nil {
			ctx.Logger.Fatalf("Update failed: could not marshal request: %v", err)
		}

		req, _ := http.NewRequest("PUT", fmt.Sprintf("%s/relationships/%d", ctx.BaseURL, relationshipID), bytes.NewBuffer(jsonBody))
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
		fmt.Println("✓ Relationship updated successfully")
	}()

	// 4. Delete
	func() {
		ctx.Logger.Printf("Step 4: Deleting relationship with ID %d...", relationshipID)
		req, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/relationships/%d", ctx.BaseURL, relationshipID), nil)
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
		fmt.Println("✓ Relationship deleted successfully")
	}()

	ctx.Logger.Println("--- Relationships Tests Passed ---")
}

// Helper function to create a character for relationship tests
func createCharacterForTest(ctx *TestContext, name string) uint {
	createBody := CreateCharacterRequest{Name: name}
	jsonBody, _ := json.Marshal(createBody)
	req, _ := http.NewRequest("POST", ctx.BaseURL+"/characters", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+ctx.Token)
	// 5. List
	func() {
		ctx.Logger.Println("Step 5: Listing relationships...")
		req, _ := http.NewRequest("GET", ctx.BaseURL+"/relationships", nil)
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
		fmt.Println("✓ Relationships listed successfully")
	}()
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusCreated {
		ctx.Logger.Fatalf("Failed to create character for relationship test: %v", err)
	}
	defer resp.Body.Close()
	var createResponse StandardResponse
	var charData CharacterResponse
	json.NewDecoder(resp.Body).Decode(&createResponse)
	dataBytes, _ := json.Marshal(createResponse.Data)
	json.Unmarshal(dataBytes, &charData)
	return charData.ID
}

// Helper function to delete a character after relationship tests
func deleteCharacterForTest(ctx *TestContext, charID uint) {
	req, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/characters/%d", ctx.BaseURL, charID), nil)
	req.Header.Set("Authorization", "Bearer "+ctx.Token)
	client := &http.Client{}
	client.Do(req)
}