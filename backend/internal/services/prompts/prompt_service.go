package prompts

import (
	"mime/multipart"
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/prompts"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

// ID 范围约束常量
const (
	// SystemPromptIDMin 系统提示词 ID 最小值
	SystemPromptIDMin uint = 10
	// SystemPromptIDMax 系统提示词 ID 最大值
	SystemPromptIDMax uint = 99
	// UserPromptIDMin 用户提示词 ID 最小值（AUTO_INCREMENT 从此开始）
	UserPromptIDMin uint = 1000
)

// promptService 实现了 prompts.PromptService 接口
type promptService struct {
	*services.GenericService[models.Prompt, uint, prompts.PromptRepository]
	repo     prompts.PromptRepository
	importer *PromptImporter
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
	return s.importer.Import(ctx, file, userID, func(c context.Context, p *models.Prompt) error {
		// ID 约束检查：如果 ID < 1000（系统保留范围），则清除让数据库自动分配
		// 如果 ID >= 1000，则保留使用
		if p.ID < UserPromptIDMin {
			p.ID = 0
		}
		return s.Create(c, p)
	})
}