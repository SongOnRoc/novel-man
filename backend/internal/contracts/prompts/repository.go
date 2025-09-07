package prompts

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
)

// PromptRepository 定义了与提示词模型相关的数据库操作。
// 它通过嵌入通用的 GenericRepository 接口来继承基础的CRUD方法。
type PromptRepository interface {
	contracts.GenericRepository[models.Prompt, uint]
}
