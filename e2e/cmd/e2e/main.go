package main

import (
	"e2e/pkg"
	"flag"
	"fmt"
	"log"
	"os"
)

func main() {
	// Define command-line flags
	testModule := flag.String("module", "all", "Specify the test module to run (e.g., auth, works, chapters, or all)")
	flag.Parse()

	// Run setup, which includes registration and login to get a global token.
	logger := log.New(os.Stdout, "[SETUP] ", log.LstdFlags)
	token, err := pkg.Setup(logger)
	if err != nil {
		log.Fatalf("Setup failed: %v", err)
	}

	log.Println("Setup successful. Token obtained.")

	// Create a context for the tests to share the token
	testCtx := &pkg.TestContext{
		Logger:   log.New(os.Stdout, "", log.LstdFlags),
		Token:    token,
		BaseURL:  pkg.BASE_URL,
	}

	// Run tests based on the specified module
	switch *testModule {
	case "all":
		log.Println("Running all test modules...")
		pkg.RunAuthTests(testCtx)
		pkg.RunWorksTests(testCtx)
		pkg.RunChaptersTests(testCtx)
		pkg.RunCharactersTests(testCtx)
		pkg.RunDraftsTests(testCtx)
		pkg.RunRelationshipsTests(testCtx)
		pkg.RunSettingsTests(testCtx)
		pkg.RunWorldviewTests(testCtx)
		pkg.RunAITests(testCtx)
	case "auth":
		pkg.RunAuthTests(testCtx)
	case "works":
		pkg.RunWorksTests(testCtx)
	case "chapters":
		pkg.RunChaptersTests(testCtx)
	case "characters":
		pkg.RunCharactersTests(testCtx)
	case "drafts":
		pkg.RunDraftsTests(testCtx)
	case "relationships":
		pkg.RunRelationshipsTests(testCtx)
	case "settings":
		pkg.RunSettingsTests(testCtx)
	case "worldview":
		pkg.RunWorldviewTests(testCtx)
	case "ai":
		pkg.RunAITests(testCtx)
	default:
		fmt.Printf("Unknown module: %s\n", *testModule)
		os.Exit(1)
	}

	log.Println("All specified tests completed successfully.")
}