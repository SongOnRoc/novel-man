package chapters

import (
	"mime/multipart"
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/upload"
)

// CreateFunc 定义创建函数类型
type CreateFunc func(context.Context, *models.Chapter) error

// ChapterImporter 章节导入器组件
type ChapterImporter struct {
	importer *upload.GenericImporter[models.Chapter]
}

// NewChapterImporter 创建章节导入器
func NewChapterImporter() *ChapterImporter {
	return &ChapterImporter{
		importer: upload.NewGenericImporter[models.Chapter](),
	}
}

// Import 导入章节
func (i *ChapterImporter) Import(ctx context.Context, file *multipart.FileHeader, userID uint, createFunc CreateFunc) (*contracts.ImportResult, error) {
	// 调用通用导入器
	result, err := i.importer.Import(ctx, file, userID, func(c context.Context, ch *models.Chapter) error {
		return createFunc(c, ch)
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
