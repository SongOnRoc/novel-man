package generate

import (
	"context"
	"fmt"
	"novel-man/backend/internal/config"
	"novel-man/backend/internal/logger"
	Ctx "novel-man/backend/utils/context"

	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/openai"
)

// LLMService defines the interface for interacting with LLM providers.
type LLMService interface {
	// GenerateStream generates text in a streaming fashion.
	GenerateStream(ctx context.Context, prompt string) (<-chan string, <-chan error)
	// Generate generates text in a blocking fashion.
	Generate(ctx context.Context, prompt string) (string, error)
}

type llmService struct {
	llm llms.Model
}

// NewLLMService creates a new instance of LLMService.
func NewLLMService() (LLMService, error) {
	cfg := config.Cfg.LLM

	// Default to OpenAI if provider is not specified or is "openai"
	// We can extend this switch for other providers later
	var llm llms.Model
	var err error

	opts := []openai.Option{}

	if cfg.APIKey != "" {
		opts = append(opts, openai.WithToken(cfg.APIKey))
	}
	if cfg.BaseURL != "" {
		opts = append(opts, openai.WithBaseURL(cfg.BaseURL))
	}
	if cfg.Model != "" {
		opts = append(opts, openai.WithModel(cfg.Model))
	}

	// 如果没有配置 API Key，我们不立即报错，而是允许服务启动。
	if cfg.APIKey == "" && cfg.BaseURL == "" {
		return &llmService{
			llm: nil,
		}, nil
	}

	llm, err = openai.New(opts...)
	if err != nil {
		// 如果初始化失败（例如环境变量也没设置），我们也不 Panic，而是返回 nil llm
		// 这样服务可以启动，调用时再报错
		logger.Warn(Ctx.New(context.Background()), "failed to create llm client: {}. AI features will be unavailable.", err)
		return &llmService{
			llm: nil,
		}, nil
	}

	return &llmService{
		llm: llm,
	}, nil
}

func (s *llmService) GenerateStream(ctx context.Context, prompt string) (<-chan string, <-chan error) {
	contentChan := make(chan string)
	errChan := make(chan error, 1)

	if s.llm == nil {
		errChan <- fmt.Errorf("LLM client is not initialized. Please check your configuration.")
		close(contentChan)
		close(errChan)
		return contentChan, errChan
	}

	go func() {
		defer close(contentChan)
		defer close(errChan)

		_, err := s.llm.Call(ctx, prompt,
			llms.WithStreamingFunc(func(ctx context.Context, chunk []byte) error {
				content := string(chunk)
				logger.Debug(Ctx.New(ctx), "GenerateStream chunk: {}", content)
				contentChan <- content
				return nil
			}),
		)
		if err != nil {
			errChan <- err
		}
	}()

	return contentChan, errChan
}

func (s *llmService) Generate(ctx context.Context, prompt string) (string, error) {
	if s.llm == nil {
		return "", fmt.Errorf("LLM client is not initialized. Please check your configuration.")
	}
	return s.llm.Call(ctx, prompt)
}
