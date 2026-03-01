package prompts

import (
	"mime/multipart"
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/upload"
)

// CreateFunc 定义创建函数类型
type CreateFunc func(context.Context, *models.Prompt) error

// PromptImporter 提示词导入器组件
type PromptImporter struct {
	importer *upload.GenericImporter[models.Prompt]
}

// NewPromptImporter 创建提示词导入器
func NewPromptImporter() *PromptImporter {
	return &PromptImporter{
		importer: upload.NewGenericImporter[models.Prompt](),
	}
}

// Import 导入提示词
func (i *PromptImporter) Import(ctx context.Context, file *multipart.FileHeader, userID uint, createFunc CreateFunc) (*contracts.ImportResult, error) {
	// 调用通用导入器
	result, err := i.importer.Import(ctx, file, userID, func(c context.Context, p *models.Prompt) error {
		return createFunc(c, p)
	})

	if err != nil {
		return nil, err
	}

	// 转换结果类型
	return &contracts.ImportResult{
		Success: result.Success,
		Failed:  result.Failed,
		Total:   result.Total,
		Errors:  result.Errors,
	}, nil
}
