package prompts

import (
	"novel-man/backend/internal/contracts/prompts"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
)

// promptService 实现了 prompts.PromptService 接口
type promptService struct {
	*services.GenericService[models.Prompt, uint, prompts.PromptRepository]
	repo prompts.PromptRepository
}

// NewPromptService 创建一个新的 prompt 服务实例
func NewPromptService(repo prompts.PromptRepository) prompts.PromptService {
	return &promptService{
		GenericService: services.NewGenericService[models.Prompt, uint, prompts.PromptRepository](repo),
		repo:           repo,
	}
}