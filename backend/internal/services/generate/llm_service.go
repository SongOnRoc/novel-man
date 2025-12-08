package generate

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"novel-man/backend/internal/config"
	"novel-man/backend/internal/logger"
	"novel-man/backend/internal/models"
	Ctx "novel-man/backend/utils/context"
	"strings"

	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/openai"
)

// LLMOptions defines configuration options for the LLM client.
type LLMOptions struct {
	Model   string
	APIKey  string
	BaseURL string
}

// LLMService defines the interface for interacting with LLM providers.
type LLMService interface {
	// GenerateStream generates text in a streaming fashion.
	GenerateStream(ctx context.Context, prompt string, opts LLMOptions) <-chan models.StreamResult
	// Generate generates text in a blocking fashion.
	Generate(ctx context.Context, prompt string, opts LLMOptions) (string, error)
	// ListModels retrieves the list of available models from the provider.
	ListModels(ctx context.Context, opts LLMOptions) ([]string, error)
}

type llmService struct {
	// Stateless service, no fields needed
}

// NewLLMService creates a new instance of LLMService.
func NewLLMService() (LLMService, error) {
	return &llmService{}, nil
}

// createClient creates a new LLM client based on system config and request options.
func (s *llmService) createClient(ctx context.Context, opts LLMOptions) (llms.Model, error) {
	// 1. Read system default config
	sysCfg := config.GetLLMConfig()

	// 2. Prepare options
	openaiOpts := []openai.Option{}

	// Priority: Request Options > System Config
	apiKey := sysCfg.APIKey
	if opts.APIKey != "" {
		apiKey = opts.APIKey
	}
	if apiKey != "" {
		openaiOpts = append(openaiOpts, openai.WithToken(apiKey))
	}

	baseURL := sysCfg.BaseURL
	if opts.BaseURL != "" {
		baseURL = opts.BaseURL
	}
	if baseURL != "" {
		openaiOpts = append(openaiOpts, openai.WithBaseURL(baseURL))
	}

	model := sysCfg.Model
	if opts.Model != "" {
		model = opts.Model
	}
	if model != "" {
		openaiOpts = append(openaiOpts, openai.WithModel(model))
	}

	// 3. Validation
	if apiKey == "" && baseURL == "" {
		return nil, fmt.Errorf("LLM configuration missing: API Key or Base URL is required")
	}

	// 4. Create client
	llm, err := openai.New(openaiOpts...)
	if err != nil {
		logger.Warn(Ctx.New(ctx), "failed to create llm client: {}", err)
		return nil, err
	}

	return llm, nil
}

func (s *llmService) GenerateStream(ctx context.Context, prompt string, opts LLMOptions) <-chan models.StreamResult {
	resultChan := make(chan models.StreamResult, 100)

	go func() {
		defer close(resultChan)

		logger.Debug(Ctx.New(ctx), "Starting GenerateStream with model: {}", opts.Model)

		llm, err := s.createClient(ctx, opts)
		if err != nil {
			logger.Error(Ctx.New(ctx), "Failed to create LLM client: {}", err)
			resultChan <- models.StreamResult{Error: err}
			return
		}

		logger.Debug(Ctx.New(ctx), "Calling LLM， prompt:\n{}", prompt)
		_, err = llm.Call(ctx, prompt,
			llms.WithStreamingFunc(func(ctx context.Context, chunk []byte) error {
				if len(chunk) == 0 {
					return nil
				}
				content := string(chunk)
				resultChan <- models.StreamResult{Content: content}
				return nil
			}),
		)
		if err != nil {
			logger.Warn(Ctx.New(ctx), "LLM Call failed: {}", err)
			resultChan <- models.StreamResult{Error: err}
		} else {
			logger.Debug(Ctx.New(ctx), "GenerateStream completed successfully")
		}
	}()

	return resultChan
}

func (s *llmService) Generate(ctx context.Context, prompt string, opts LLMOptions) (string, error) {
	llm, err := s.createClient(ctx, opts)
	if err != nil {
		return "", err
	}
	return llm.Call(ctx, prompt)
}

// ListModels retrieves the list of available models from the provider.
func (s *llmService) ListModels(ctx context.Context, opts LLMOptions) ([]string, error) {
	// 1. Read system default config
	sysCfg := config.GetLLMConfig()

	// 2. Merge options (Priority: Request Options > System Config)
	cfg := sysCfg
	if opts.APIKey != "" {
		cfg.APIKey = opts.APIKey
	}
	if opts.BaseURL != "" {
		cfg.BaseURL = opts.BaseURL
	}
	// Provider is assumed to be from system config for now.

	provider := strings.ToLower(cfg.Provider)

	switch provider {
	case "gemini", "google":
		return s.listModelsGemini(ctx, cfg)
	case "anthropic":
		return s.listModelsAnthropic(ctx, cfg)
	case "openai":
		return s.listModelsOpenAI(ctx, cfg)
	default:
		// Default to OpenAI logic
		return s.listModelsOpenAI(ctx, cfg)
	}
}

func (s *llmService) listModelsAnthropic(ctx context.Context, cfg config.LLMConfig) ([]string, error) {
	// Anthropic API (or compatible proxy) reuses OpenAI logic
	return s.listModelsOpenAI(ctx, cfg)
}

func (s *llmService) listModelsOpenAI(ctx context.Context, cfg config.LLMConfig) ([]string, error) {
	baseURL := cfg.BaseURL
	if baseURL == "" {
		// If BaseURL is empty, we assume official OpenAI API
		baseURL = "https://api.openai.com/v1"
	}

	// Ensure URL ends with /models
	url := fmt.Sprintf("%s/models", strings.TrimRight(baseURL, "/"))

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	if cfg.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+cfg.APIKey)
		// Some providers/proxies might expect x-api-key as well
		req.Header.Set("x-api-key", cfg.APIKey)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to fetch models from OpenAI/Anthropic: status %d, body: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	models := make([]string, len(result.Data))
	for i, m := range result.Data {
		models[i] = m.ID
	}

	return models, nil
}

func (s *llmService) listModelsGemini(ctx context.Context, cfg config.LLMConfig) ([]string, error) {
	baseURL := cfg.BaseURL
	if baseURL == "" {
		baseURL = "https://generativelanguage.googleapis.com/v1beta"
	}

	url := fmt.Sprintf("%s/models?key=%s", strings.TrimRight(baseURL, "/"), cfg.APIKey)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to fetch models from Gemini: status %d, body: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Models []struct {
			Name        string `json:"name"`
			DisplayName string `json:"displayName"`
		} `json:"models"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	models := make([]string, 0, len(result.Models))
	for _, m := range result.Models {
		// Gemini model names usually come as "models/gemini-pro".
		// We strip "models/" prefix.
		name := m.Name
		if len(name) > 7 && name[:7] == "models/" {
			name = name[7:]
		}
		models = append(models, name)
	}

	return models, nil
}
