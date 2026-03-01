package gorm

import (
	"novel-man/backend/internal/contracts/prompts"
	"novel-man/backend/internal/models"

	"gorm.io/gorm"
)

// PromptGormRepository 通过嵌入 GenericGormRepository 来复用代码
type PromptGormRepository struct {
	*GenericGormRepository[models.Prompt, uint]
	db *gorm.DB
}

// NewPromptGormRepository 创建一个新的 PromptRepository 实例
func NewPromptGormRepository(db *gorm.DB) prompts.PromptRepository {
	return &PromptGormRepository{
		GenericGormRepository: NewGenericGormRepository[models.Prompt, uint](db),
		db:                    db,
	}
}
