package generate

import (
	"context"
	"errors"
	"testing"
	"time"

	"novel-man/backend/internal/models"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockLLMService struct {
	mock.Mock
}

func (m *MockLLMService) GenerateStream(ctx context.Context, prompt string, opts LLMOptions) (<-chan string, <-chan error) {
	args := m.Called(ctx, prompt, opts)
	return args.Get(0).(<-chan string), args.Get(1).(<-chan error)
}

func (m *MockLLMService) Generate(ctx context.Context, prompt string, opts LLMOptions) (string, error) {
	args := m.Called(ctx, prompt, opts)
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

		expectedPrompt := "Role: creative-writing\nHello"

		contentChan := make(chan string, 2)
		errChan := make(chan error, 1)

		contentChan <- "World"
		contentChan <- "!"
		close(contentChan)
		close(errChan)

		mockLLM.On("GenerateStream", mock.Anything, expectedPrompt, mock.AnythingOfType("LLMOptions")).Return((<-chan string)(contentChan), (<-chan error)(errChan))

		ctx := context.Background()
		respContentChan, respErrChan, err := service.GenerateTextStream(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, respContentChan)
		assert.NotNil(t, respErrChan)

		var result string
		for chunk := range respContentChan {
			result += chunk
		}

		select {
		case err := <-respErrChan:
			if err != nil {
				t.Errorf("unexpected error from stream: %v", err)
			}
		default:
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

		contentChan := make(chan string)
		errChan := make(chan error, 1)

		expectedErr := errors.New("llm error")
		errChan <- expectedErr
		close(contentChan)
		close(errChan)

		mockLLM.On("GenerateStream", mock.Anything, "Error case", mock.AnythingOfType("LLMOptions")).Return((<-chan string)(contentChan), (<-chan error)(errChan))

		ctx := context.Background()
		respContentChan, respErrChan, err := service.GenerateTextStream(ctx, req)

		assert.NoError(t, err)

		for range respContentChan {
		}

		select {
		case receivedErr := <-respErrChan:
			assert.Equal(t, expectedErr, receivedErr)
		case <-time.After(1 * time.Second):
			t.Error("timeout waiting for error")
		}

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

		expectedPrompt := "Just text"

		contentChan := make(chan string)
		errChan := make(chan error)
		close(contentChan)
		close(errChan)

		mockLLM.On("GenerateStream", mock.Anything, expectedPrompt, mock.AnythingOfType("LLMOptions")).Return((<-chan string)(contentChan), (<-chan error)(errChan))

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

		expectedPrompt := "Role: creative-writing\nWrite a story"
		expectedResponse := "Once upon a time..."

		mockLLM.On("Generate", mock.Anything, expectedPrompt, mock.AnythingOfType("LLMOptions")).Return(expectedResponse, nil)

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

		expectedErr := errors.New("llm error")
		mockLLM.On("Generate", mock.Anything, "Error case", mock.AnythingOfType("LLMOptions")).Return("", expectedErr)

		ctx := context.Background()
		resp, err := service.GenerateText(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, resp)
		assert.Equal(t, expectedErr, err)
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
