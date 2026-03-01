package generate

import (
	"context"
	"fmt"
	"novel-man/backend/internal/contracts/generate"
	"novel-man/backend/internal/contracts/prompts"
	"novel-man/backend/internal/logger"
	"novel-man/backend/internal/models"
	Ctx "novel-man/backend/utils/context"
)

type generateService struct {
	llmService LLMService
	promptRepo prompts.PromptRepository
}

// NewGenerateService creates a new instance of GenerateService.
func NewGenerateService(promptRepo prompts.PromptRepository) (generate.GenerateService, error) {
	llm, err := NewLLMService()
	if err != nil {
		return nil, err
	}
	return &generateService{
		llmService: llm,
		promptRepo: promptRepo,
	}, nil
}

// prepareMessages generates text based on the provided request.
func (s *generateService) prepareMessages(ctx context.Context, req *models.GenerateRequest) ([]models.Message, error) {
	var messages []models.Message
	ctxWrapper := Ctx.New(ctx)

	// 1. Add System Prompt (priority: PromptID > AssistantType > SystemPrompt)
	if req.PromptID != nil && *req.PromptID > 0 {
		logger.Debug(ctxWrapper, "Loading prompt from database with ID: {}", *req.PromptID)
		// 从数据库加载提示词
		prompt, err := s.promptRepo.GetByID(*ctxWrapper, *req.PromptID)
		if err != nil {
			logger.Error(ctxWrapper, "Failed to load prompt with ID {}: {}", *req.PromptID, err)
			return nil, fmt.Errorf("prompt with id %d not found", *req.PromptID)
		}
		logger.Debug(ctxWrapper, "Loaded prompt: title='{}', content length={}", prompt.Title, len(prompt.Content))
		messages = append(messages, models.Message{
			Role:    "system",
			Content: prompt.Content,
		})
		// 异步更新使用计数，使用原始 context 的 traceID 以便溯源
		go func(promptToUpdate *models.Prompt, originalCtx Ctx.Context) {
			promptToUpdate.UsageCount++
			_ = s.promptRepo.Update(originalCtx, promptToUpdate.ID, promptToUpdate)
		}(prompt, *ctxWrapper)
	} else if req.AssistantType != "" {
		// Priority: AssistantType overrides explicit SystemPrompt
		messages = append(messages, models.Message{
			Role:    "system",
			Content: fmt.Sprintf("You are a %s assistant.", req.AssistantType),
		})
	} else if req.SystemPrompt != "" {
		messages = append(messages, models.Message{
			Role:    "system",
			Content: req.SystemPrompt,
		})
	}

	// 2. Add History Messages
	if len(req.Messages) > 0 {
		messages = append(messages, req.Messages...)
	}

	// 3. Add Text as User Message (Backward Compatibility)
	// Only add if Text is provided and (Messages is empty OR Text is not already in Messages)
	// To avoid duplication, we assume if Messages is provided, Text might be redundant or supplementary.
	// Simple rule: If Text is present, append it as a User message.
	if req.Text != "" {
		messages = append(messages, models.Message{
			Role:    "user",
			Content: req.Text,
		})
	}

	return messages, nil
}

func (s *generateService) GenerateText(ctx context.Context, req *models.GenerateRequest) (*models.GenerateResponse, error) {
	messages, err := s.prepareMessages(ctx, req)
	if err != nil {
		return nil, err
	}

	opts := LLMOptions{
		Model:   req.Model,
		APIKey:  req.APIKey,
		BaseURL: req.BaseURL,
	}

	generatedText, err := s.llmService.Generate(ctx, messages, opts)
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
	messages, err := s.prepareMessages(ctx, req)
	if err != nil {
		return nil, err
	}

	opts := LLMOptions{
		Model:   req.Model,
		APIKey:  req.APIKey,
		BaseURL: req.BaseURL,
	}

	return s.llmService.GenerateStream(ctx, messages, opts), nil
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
