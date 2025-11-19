package works

import (
	"mime/multipart"
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/upload"
)

// CreateFunc 定义创建函数类型
type CreateFunc func(context.Context, *models.Work) error

// WorkImporter 作品导入器组件
type WorkImporter struct {
	importer *upload.GenericImporter[models.Work]
}

// NewWorkImporter 创建作品导入器
func NewWorkImporter() *WorkImporter {
	return &WorkImporter{
		importer: upload.NewGenericImporter[models.Work](),
	}
}

// Import 导入作品
func (i *WorkImporter) Import(ctx context.Context, file *multipart.FileHeader, userID uint, createFunc CreateFunc) (*contracts.ImportResult, error) {
	// 调用通用导入器
	result, err := i.importer.Import(ctx, file, userID, func(c context.Context, w *models.Work) error {
		return createFunc(c, w)
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
