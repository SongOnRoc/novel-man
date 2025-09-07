package generate

import (
	"fmt"
	"novel-man/backend/internal/contracts/generate"
	"novel-man/backend/internal/models"
)

type generateService struct {
}

// NewGenerateService creates a new instance of GenerateService.
func NewGenerateService() generate.GenerateService {
	return &generateService{}
}

// GenerateText is a placeholder implementation that returns a mock response.
func (s *generateService) GenerateText(req *models.GenerateRequest) (*models.GenerateResponse, error) {
	responseText := fmt.Sprintf("Generated text for assistant: %s", req.AssistantType)
	if req.PromptID != nil {
		responseText = fmt.Sprintf("Generated text for prompt_id: %d", *req.PromptID)
	}

	return &models.GenerateResponse{
		GeneratedText: responseText,
	}, nil
}

// GetAssistantTypes returns a hardcoded list of assistant types as specified in the requirements.
func (s *generateService) GetAssistantTypes() ([]models.AssistantTypeResponse, error) {
	return []models.AssistantTypeResponse{
		{Name: "default", Label: "默认助手"},
		{Name: "creative-writing", Label: "创意写作助手"},
		{Name: "technical-writing", Label: "技术写作助手"},
	}, nil
}