package pkg

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// RunAITests executes tests for the /ai endpoints.
func RunAITests(ctx *TestContext) {
	ctx.Logger.Println("--- Running AI Tests ---")

	// 1. Text Completion
	func() {
		ctx.Logger.Println("Step 1: Testing text completion...")
		reqBody := CompletionRequest{Text: "Once upon a time"}
		jsonBody, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", ctx.BaseURL+"/ai/completion", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+ctx.Token)
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Completion failed: request error: %v", err)
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			ctx.Logger.Fatalf("Completion failed: expected status 200, got %d", resp.StatusCode)
		}
		fmt.Println("✓ Text completion test passed")
	}()

	// 2. Create Character
	func() {
		ctx.Logger.Println("Step 2: Testing character creation...")
		reqBody := CreateCharacterAIRequest{Description: "A brave knight"}
		jsonBody, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", ctx.BaseURL+"/ai/create-character", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+ctx.Token)
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Create character failed: request error: %v", err)
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			ctx.Logger.Fatalf("Create character failed: expected status 200, got %d", resp.StatusCode)
		}
		fmt.Println("✓ Create character test passed")
	}()

	// 3. Generate Idea
	func() {
		ctx.Logger.Println("Step 3: Testing idea generation...")
		reqBody := GenerateIdeaRequest{Text: "A story about a dragon"}
		jsonBody, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", ctx.BaseURL+"/ai/generate-idea", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+ctx.Token)
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Generate idea failed: request error: %v", err)
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			ctx.Logger.Fatalf("Generate idea failed: expected status 200, got %d", resp.StatusCode)
		}
		fmt.Println("✓ Generate idea test passed")
	}()

	// 4. Generate Outline
	func() {
		ctx.Logger.Println("Step 4: Testing outline generation...")
		reqBody := GenerateOutlineRequest{Text: "A sci-fi novel"}
		jsonBody, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", ctx.BaseURL+"/ai/generate-outline", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+ctx.Token)
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Generate outline failed: request error: %v", err)
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			ctx.Logger.Fatalf("Generate outline failed: expected status 200, got %d", resp.StatusCode)
		}
		fmt.Println("✓ Generate outline test passed")
	}()

	// 5. Text Polishing
	func() {
		ctx.Logger.Println("Step 5: Testing text polishing...")
		reqBody := PolishRequest{Text: "it was a dark and stormy nite"}
		jsonBody, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", ctx.BaseURL+"/ai/polish", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+ctx.Token)
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Polish failed: request error: %v", err)
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			ctx.Logger.Fatalf("Polish failed: expected status 200, got %d", resp.StatusCode)
		}
		fmt.Println("✓ Text polishing test passed")
	}()

	ctx.Logger.Println("--- AI Tests Passed ---")
}