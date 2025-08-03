package ai

import (
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

// AIService defines the interface for AI related services.
// It includes methods for text completion, polishing, and other AI features.
type AIService interface {
	// Completion handles text completion requests.
	Completion(ctx context.Context, prompt string, aiContext *models.AIContext) (string, error)
	// Polish handles text polishing requests.
	Polish(ctx context.Context, text string, aiContext *models.AIContext) (string, error)
	// GenerateIdea handles idea generation requests.
	GenerateIdea(ctx context.Context, text string, aiContext *models.AIContext) (string, error)
	// GenerateOutline handles outline generation requests.
	GenerateOutline(ctx context.Context, text string, aiContext *models.AIContext) (string, error)
	// CreateCharacter handles character creation requests.
	CreateCharacter(ctx context.Context, description string, aiContext *models.AIContext) (*models.CreateCharacterResponse, error)
}
