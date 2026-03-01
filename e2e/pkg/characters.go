package pkg

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// RunCharactersTests executes the full CRUD lifecycle for the /characters endpoint.
func RunCharactersTests(ctx *TestContext) {
	ctx.Logger.Println("--- Running Characters Tests ---")
	var characterID uint

	// 1. Create
	func() {
		ctx.Logger.Println("Step 1: Creating a new character...")
		createBody := CreateCharacterRequest{
			Name: "E2E Test Character",
		}
		jsonBody, err := json.Marshal(createBody)
		if err != nil {
			ctx.Logger.Fatalf("Create failed: could not marshal request: %v", err)
		}

		req, _ := http.NewRequest("POST", ctx.BaseURL+"/characters", bytes.NewBuffer(jsonBody))
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
		var charData CharacterResponse
		if err := json.NewDecoder(resp.Body).Decode(&createResponse); err != nil {
			ctx.Logger.Fatalf("Create failed: could not decode response: %v", err)
		}
		dataBytes, _ := json.Marshal(createResponse.Data)
		json.Unmarshal(dataBytes, &charData)

		if charData.ID == 0 {
			ctx.Logger.Fatalf("Create failed: character ID is 0")
		}
		characterID = charData.ID
		fmt.Println("✓ Character created successfully")
	}()

	// 2. Get
	func() {
		ctx.Logger.Printf("Step 2: Getting character with ID %d...", characterID)
		req, _ := http.NewRequest("GET", fmt.Sprintf("%s/characters/%d", ctx.BaseURL, characterID), nil)
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
		fmt.Println("✓ Character retrieved successfully")
	}()

	// 3. Update
	func() {
		ctx.Logger.Printf("Step 3: Updating character with ID %d...", characterID)
		updateBody := UpdateCharacterRequest{
			Name: "Updated E2E Character",
		}
		jsonBody, err := json.Marshal(updateBody)
		if err != nil {
			ctx.Logger.Fatalf("Update failed: could not marshal request: %v", err)
		}

		req, _ := http.NewRequest("PUT", fmt.Sprintf("%s/characters/%d", ctx.BaseURL, characterID), bytes.NewBuffer(jsonBody))
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
		fmt.Println("✓ Character updated successfully")
	}()

	// 4. List
	func() {
		ctx.Logger.Println("Step 4: Listing characters...")
		req, _ := http.NewRequest("GET", ctx.BaseURL+"/characters", nil)
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
		fmt.Println("✓ Characters listed successfully")
	}()

	// 5. Delete
	func() {
		ctx.Logger.Printf("Step 5: Deleting character with ID %d...", characterID)
		req, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/characters/%d", ctx.BaseURL, characterID), nil)
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
		fmt.Println("✓ Character deleted successfully")
	}()

	ctx.Logger.Println("--- Characters Tests Passed ---")
}