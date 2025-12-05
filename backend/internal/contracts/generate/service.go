package generate

import (
	"context"
	"novel-man/backend/internal/models"
)

// GenerateService defines the interface for the generation service.
type GenerateService interface {
	// GenerateText generates text based on the provided request.
	GenerateText(ctx context.Context, req *models.GenerateRequest) (*models.GenerateResponse, error)
	// GenerateTextStream generates text in a streaming fashion.
	GenerateTextStream(ctx context.Context, req *models.GenerateRequest) (<-chan string, <-chan error, error)
	// GetAssistantTypes returns a list of available assistant types.
	GetAssistantTypes() ([]models.AssistantTypeResponse, error)
}