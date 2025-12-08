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

	opts := LLMOptions{
		Model:   req.Model,
		APIKey:  req.APIKey,
		BaseURL: req.BaseURL,
	}

	generatedText, err := s.llmService.Generate(ctx, prompt, opts)
	if err != nil {
		return nil, err
	}

	logger.Info(Ctx.New(ctx), "GenerateText response: {}", generatedText)

	return &models.GenerateResponse{
		GeneratedText: generatedText,
	}, nil
}

// GenerateTextStream generates text in a streaming fashion.
func (s *generateService) GenerateTextStream(ctx context.Context, req *models.GenerateRequest) (<-chan models.StreamResult, error) {
	// Construct prompt based on request
	prompt := req.Text
	if req.AssistantType != "" {
		prompt = fmt.Sprintf("Role: %s\n%s", req.AssistantType, prompt)
	}

	opts := LLMOptions{
		Model:   req.Model,
		APIKey:  req.APIKey,
		BaseURL: req.BaseURL,
	}

	return s.llmService.GenerateStream(ctx, prompt, opts), nil
}

// GetAssistantTypes returns a hardcoded list of assistant types as specified in the requirements.
func (s *generateService) GetAssistantTypes() ([]models.AssistantTypeResponse, error) {
	return []models.AssistantTypeResponse{
		{Name: "default", Label: "默认助手"},
		{Name: "creative-writing", Label: "创意写作助手"},
		{Name: "technical-writing", Label: "技术写作助手"},
	}, nil
}

// GetAvailableModels returns a list of available models.
func (s *generateService) GetAvailableModels(ctx context.Context, req *models.ModelListRequest) ([]models.ModelResponse, error) {
	opts := LLMOptions{
		APIKey:  req.APIKey,
		BaseURL: req.BaseURL,
	}

	modelIDs, err := s.llmService.ListModels(ctx, opts)
	if err != nil {
		logger.Error(Ctx.New(ctx), "Failed to list models: {}", err)
		return nil, err
	}

	res := make([]models.ModelResponse, len(modelIDs))
	for i, id := range modelIDs {
		res[i] = models.ModelResponse{
			ID:    id,
			Name:  id,
			Label: id, // Use ID as label for now
		}
	}
	return res, nil
}
