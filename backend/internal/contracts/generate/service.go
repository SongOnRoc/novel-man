package generate

import (
	"novel-man/backend/internal/models"
)

// GenerateService defines the interface for the generation service.
type GenerateService interface {
	// GenerateText generates text based on the provided request.
	GenerateText(req *models.GenerateRequest) (*models.GenerateResponse, error)
	// GetAssistantTypes returns a list of available assistant types.
	GetAssistantTypes() ([]models.AssistantTypeResponse, error)
}