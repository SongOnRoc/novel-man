package pkg

import (
	"fmt"
	"net/http"
)

// RunAuthTests checks if the authentication token is valid and tests logout.
func RunAuthTests(ctx *TestContext) {
	ctx.Logger.Println("--- Running Auth Tests ---")

	// 1. Check Token Presence
	func() {
		ctx.Logger.Println("Step 1: Verifying token presence...")
		if ctx.Token == "" {
			ctx.Logger.Fatal("Assertion failed: Token is empty")
		}
		fmt.Println("✓ Auth token is present")
	}()

	// 2. Logout
	func() {
		ctx.Logger.Println("Step 2: Logging out...")
		req, _ := http.NewRequest("POST", ctx.BaseURL+"/auth/logout", nil)
		req.Header.Set("Authorization", "Bearer "+ctx.Token)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			ctx.Logger.Fatalf("Logout failed: request error: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			ctx.Logger.Fatalf("Logout failed: expected status 200, got %d", resp.StatusCode)
		}
		fmt.Println("✓ Logout successful")
	}()

	ctx.Logger.Println("--- Auth Tests Passed ---")
}