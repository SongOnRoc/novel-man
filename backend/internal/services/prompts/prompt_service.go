package prompts

import (
	"mime/multipart"
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/prompts"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

// promptService 实现了 prompts.PromptService 接口
type promptService struct {
	*services.GenericService[models.Prompt, uint, prompts.PromptRepository]
	repo          prompts.PromptRepository
	importer      *PromptImporter
}

// NewPromptService 创建一个新的 prompt 服务实例
func NewPromptService(repo prompts.PromptRepository) prompts.PromptService {
	return &promptService{
		GenericService: services.NewGenericService[models.Prompt, uint, prompts.PromptRepository](repo),
		repo:           repo,
		importer:       NewPromptImporter(),
	}
}

// Import 实现通用导入接口
func (s *promptService) Import(ctx context.Context, file *multipart.FileHeader, userID uint) (*contracts.ImportResult, error) {
	return s.importer.Import(ctx, file, userID, s.Create)
}
