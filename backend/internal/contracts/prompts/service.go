package prompts

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
)

// PromptService 通过组合基础 CRUD 接口和通用导入接口形成
type PromptService interface {
	contracts.GenericCRUD[models.Prompt, uint]
	contracts.Importer
}
