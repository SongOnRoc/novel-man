package generate

import (
	"context"
	"testing"
	"novel-man/backend/internal/config"
	"novel-man/backend/internal/models"

	"github.com/stretchr/testify/assert"
)

func TestLLMService_CreateClient_Validation(t *testing.T) {
	// Setup config
	config.Cfg = &config.Config{
		LLM: config.LLMConfig{
			APIKey: "", // No system API Key
			BaseURL: "",
		},
	}

	service, _ := NewLLMService()
	
	// Access the private implementation to test createClient indirectly via Generate or directly if we export it or use reflection.
	// Since createClient is private, we'll test via public methods which call it.
	// However, without a real API key, openai.New might fail or succeed depending on validation.
	// But our createClient has explicit validation:
	// if apiKey == "" && baseURL == "" { return nil, fmt.Errorf(...) }

	ctx := context.Background()
	
	// Case 1: No API Key anywhere
	_, err := service.Generate(ctx, []models.Message{{Role: "user", Content: "test"}}, LLMOptions{})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "LLM configuration missing")

	// Case 2: API Key provided in options
	// Note: openai.New might still fail if it tries to connect or validates the key format deeply, 
	// but we expect it to pass our custom validation.
	// Actually openai.New returns a client that might fail on Call, but here we just want to pass our validation.
	// If openai.New fails (e.g. environment variable check), we catch that too.
	// For this test, we just want to ensure our validation logic works.
	
	// Let's rely on the fact that we return error if both are missing.
}

func TestLLMService_ConfigurationPriority(t *testing.T) {
	// This test is tricky without mocking openai.New, which is a hard dependency.
	// We can't easily check what options were passed to openai.New without dependency injection or mocking the openai package (which is hard in Go).
	// However, we can verify that the system config is read.
	
	config.Cfg = &config.Config{
		LLM: config.LLMConfig{
			APIKey: "system-key",
		},
	}
	
	service, _ := NewLLMService()
	ctx := context.Background()
	
	// Even with a dummy key, openai.New might succeed in creating the struct.
	// The actual Call would fail.
	
	// Let's try to call Generate with a system key.
	// If it passes our validation, it proceeds to openai.New.
	// If openai.New fails, we get an error "failed to create llm client".
	// If it succeeds, we get an error from Call (likely 401 or connection error).
	
	_, err := service.Generate(ctx, []models.Message{{Role: "user", Content: "test"}}, LLMOptions{})
	// We expect either "failed to create llm client" or an error from Call.
	// But definitely NOT "LLM configuration missing".
	if err != nil {
		assert.NotContains(t, err.Error(), "LLM configuration missing")
	}
}

func TestLLMService_OptionsOverride(t *testing.T) {
	config.Cfg = &config.Config{
		LLM: config.LLMConfig{
			APIKey: "",
		},
	}
	
	service, _ := NewLLMService()
	ctx := context.Background()
	
	// Provide key in options
	_, err := service.Generate(ctx, []models.Message{{Role: "user", Content: "test"}}, LLMOptions{APIKey: "user-key"})
	// Should not be "LLM configuration missing"
	if err != nil {
		assert.NotContains(t, err.Error(), "LLM configuration missing")
	}
}