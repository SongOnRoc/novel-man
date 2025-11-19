package contracts

import (
	"mime/multipart"
	"novel-man/backend/utils/context"
)

// ImportResult 导入结果
type ImportResult struct {
	Success int      `json:"success"`
	Failed  int      `json:"failed"`
	Total   int      `json:"total"`
	Errors  []string `json:"errors,omitempty"`
}

// Importer 导入器接口
type Importer interface {
	Import(ctx context.Context, file *multipart.FileHeader, userID uint) (*ImportResult, error)
}