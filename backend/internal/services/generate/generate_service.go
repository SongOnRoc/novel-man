package generate

import (
	"context"
	"fmt"
	"novel-man/backend/internal/contracts/generate"
	"novel-man/backend/internal/logger"
	"novel-man/backend/internal/models"
	Ctx "novel-man/backend/utils/context"
)

type generateService struct {
	llmService LLMService
}

// NewGenerateService creates a new instance of GenerateService.
func NewGenerateService() (generate.GenerateService, error) {
	llm, err := NewLLMService()
	if err != nil {
		return nil, err
	}
	return &generateService{
		llmService: llm,
	}, nil
}

// GenerateText generates text based on the provided request.
func (s *generateService) GenerateText(ctx context.Context, req *models.GenerateRequest) (*models.GenerateResponse, error) {
	// Construct prompt based on request
	prompt := req.Text
	if req.AssistantType != "" {
		prompt = fmt.Sprintf("Role: %s\n%s", req.AssistantType, prompt)
	}

	generatedText, err := s.llmService.Generate(ctx, prompt)
	if err != nil {
		return nil, err
	}

	logger.Info(Ctx.New(ctx), "GenerateText response: {}", generatedText)

	return &models.GenerateResponse{
		GeneratedText: generatedText,
	}, nil
}

// GenerateTextStream generates text in a streaming fashion.
func (s *generateService) GenerateTextStream(ctx context.Context, req *models.GenerateRequest) (<-chan string, <-chan error, error) {
	// Construct prompt based on request
	prompt := req.Text
	if req.AssistantType != "" {
		prompt = fmt.Sprintf("Role: %s\n%s", req.AssistantType, prompt)
	}

	contentChan, errChan := s.llmService.GenerateStream(ctx, prompt)
	return contentChan, errChan, nil
}

// GetAssistantTypes returns a hardcoded list of assistant types as specified in the requirements.
func (s *generateService) GetAssistantTypes() ([]models.AssistantTypeResponse, error) {
	return []models.AssistantTypeResponse{
		{Name: "default", Label: "默认助手"},
		{Name: "creative-writing", Label: "创意写作助手"},
		{Name: "technical-writing", Label: "技术写作助手"},
	}, nil
}