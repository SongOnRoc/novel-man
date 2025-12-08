package generate

import (
	"context"
	"errors"
	"testing"

	"novel-man/backend/internal/models"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockLLMService struct {
	mock.Mock
}

func (m *MockLLMService) GenerateStream(ctx context.Context, messages []models.Message, opts LLMOptions) <-chan models.StreamResult {
	args := m.Called(ctx, messages, opts)
	return args.Get(0).(<-chan models.StreamResult)
}

func (m *MockLLMService) Generate(ctx context.Context, messages []models.Message, opts LLMOptions) (string, error) {
	args := m.Called(ctx, messages, opts)
	return args.String(0), args.Error(1)
}

func (m *MockLLMService) ListModels(ctx context.Context, opts LLMOptions) ([]string, error) {
	args := m.Called(ctx, opts)
	return args.Get(0).([]string), args.Error(1)
}

func TestGenerateService_GenerateTextStream(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockLLM := new(MockLLMService)
		service := &generateService{
			llmService: mockLLM,
		}

		req := &models.GenerateRequest{
			Text:          "Hello",
			AssistantType: "creative-writing",
		}

		expectedMessages := []models.Message{
			{Role: "system", Content: "You are a creative-writing assistant."},
			{Role: "user", Content: "Hello"},
		}

		resultChan := make(chan models.StreamResult, 2)
		resultChan <- models.StreamResult{Content: "World"}
		resultChan <- models.StreamResult{Content: "!"}
		close(resultChan)

		mockLLM.On("GenerateStream", mock.Anything, expectedMessages, mock.AnythingOfType("LLMOptions")).Return((<-chan models.StreamResult)(resultChan))

		ctx := context.Background()
		respChan, err := service.GenerateTextStream(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, respChan)

		var result string
		for chunk := range respChan {
			assert.NoError(t, chunk.Error)
			result += chunk.Content
		}

		assert.Equal(t, "World!", result)
		mockLLM.AssertExpectations(t)
	})

	t.Run("llm service returns error immediately", func(t *testing.T) {
		mockLLM := new(MockLLMService)
		service := &generateService{
			llmService: mockLLM,
		}

		req := &models.GenerateRequest{
			Text: "Error case",
		}

		resultChan := make(chan models.StreamResult, 1)
		expectedErr := errors.New("llm error")
		resultChan <- models.StreamResult{Error: expectedErr}
		close(resultChan)

		expectedMessages := []models.Message{
			{Role: "user", Content: "Error case"},
		}
		mockLLM.On("GenerateStream", mock.Anything, expectedMessages, mock.AnythingOfType("LLMOptions")).Return((<-chan models.StreamResult)(resultChan))

		ctx := context.Background()
		respChan, err := service.GenerateTextStream(ctx, req)

		assert.NoError(t, err)

		received := <-respChan
		assert.Equal(t, expectedErr, received.Error)

		mockLLM.AssertExpectations(t)
	})

	t.Run("without assistant type", func(t *testing.T) {
		mockLLM := new(MockLLMService)
		service := &generateService{
			llmService: mockLLM,
		}

		req := &models.GenerateRequest{
			Text: "Just text",
		}

		expectedMessages := []models.Message{
			{Role: "user", Content: "Just text"},
		}

		resultChan := make(chan models.StreamResult)
		close(resultChan)

		mockLLM.On("GenerateStream", mock.Anything, expectedMessages, mock.AnythingOfType("LLMOptions")).Return((<-chan models.StreamResult)(resultChan))

		service.GenerateTextStream(context.Background(), req)

		mockLLM.AssertExpectations(t)
	})
}

func TestGenerateService_GenerateText(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockLLM := new(MockLLMService)
		service := &generateService{
			llmService: mockLLM,
		}

		req := &models.GenerateRequest{
			Text:          "Write a story",
			AssistantType: "creative-writing",
		}

		expectedMessages := []models.Message{
			{Role: "system", Content: "You are a creative-writing assistant."},
			{Role: "user", Content: "Write a story"},
		}
		expectedResponse := "Once upon a time..."

		mockLLM.On("Generate", mock.Anything, expectedMessages, mock.AnythingOfType("LLMOptions")).Return(expectedResponse, nil)

		ctx := context.Background()
		resp, err := service.GenerateText(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, expectedResponse, resp.GeneratedText)
		mockLLM.AssertExpectations(t)
	})

	t.Run("error", func(t *testing.T) {
		mockLLM := new(MockLLMService)
		service := &generateService{
			llmService: mockLLM,
		}

		req := &models.GenerateRequest{
			Text: "Error case",
		}

		expectedMessages := []models.Message{
			{Role: "user", Content: "Error case"},
		}
		expectedErr := errors.New("llm error")
		mockLLM.On("Generate", mock.Anything, expectedMessages, mock.AnythingOfType("LLMOptions")).Return("", expectedErr)

		ctx := context.Background()
		resp, err := service.GenerateText(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, resp)
		assert.Equal(t, expectedErr, err)
		mockLLM.AssertExpectations(t)
	})

	t.Run("with assistant type override system prompt", func(t *testing.T) {
		mockLLM := new(MockLLMService)
		service := &generateService{
			llmService: mockLLM,
		}

		req := &models.GenerateRequest{
			Text:          "Hello",
			SystemPrompt:  "Ignored System Prompt",
			AssistantType: "creative-writing",
		}

		expectedMessages := []models.Message{
			{Role: "system", Content: "You are a creative-writing assistant."},
			{Role: "user", Content: "Hello"},
		}

		mockLLM.On("Generate", mock.Anything, expectedMessages, mock.AnythingOfType("LLMOptions")).Return("Response", nil)

		ctx := context.Background()
		_, err := service.GenerateText(ctx, req)
		assert.NoError(t, err)
		mockLLM.AssertExpectations(t)
	})

	t.Run("with explicit system prompt only", func(t *testing.T) {
		mockLLM := new(MockLLMService)
		service := &generateService{
			llmService: mockLLM,
		}

		req := &models.GenerateRequest{
			Text:         "Hello",
			SystemPrompt: "Custom System Prompt",
		}

		expectedMessages := []models.Message{
			{Role: "system", Content: "Custom System Prompt"},
			{Role: "user", Content: "Hello"},
		}

		mockLLM.On("Generate", mock.Anything, expectedMessages, mock.AnythingOfType("LLMOptions")).Return("Response", nil)

		ctx := context.Background()
		_, err := service.GenerateText(ctx, req)
		assert.NoError(t, err)
		mockLLM.AssertExpectations(t)
	})

	t.Run("with messages", func(t *testing.T) {
		mockLLM := new(MockLLMService)
		service := &generateService{
			llmService: mockLLM,
		}

		req := &models.GenerateRequest{
			Messages: []models.Message{
				{Role: "user", Content: "User Msg 1"},
				{Role: "assistant", Content: "AI Msg 1"},
			},
			Text: "User Msg 2", // Should be appended
		}

		expectedMessages := []models.Message{
			{Role: "user", Content: "User Msg 1"},
			{Role: "assistant", Content: "AI Msg 1"},
			{Role: "user", Content: "User Msg 2"},
		}

		mockLLM.On("Generate", mock.Anything, expectedMessages, mock.AnythingOfType("LLMOptions")).Return("Response", nil)

		ctx := context.Background()
		_, err := service.GenerateText(ctx, req)
		assert.NoError(t, err)
		mockLLM.AssertExpectations(t)
	})
}

func TestGenerateService_GetAssistantTypes(t *testing.T) {
	service := &generateService{}

	types, err := service.GetAssistantTypes()

	assert.NoError(t, err)
	assert.Len(t, types, 3)
	assert.Equal(t, "default", types[0].Name)
	assert.Equal(t, "creative-writing", types[1].Name)
	assert.Equal(t, "technical-writing", types[2].Name)
}
