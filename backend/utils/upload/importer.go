package upload

import (
	"mime/multipart"
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/logger"
	"novel-man/backend/utils/context"
	"reflect"
)

// CreateFunc 定义创建函数类型
type CreateFunc[T any] func(context.Context, *T) error

// GenericImporter 通用导入器
type GenericImporter[T any] struct {
	parser *Parser
	mapper *ModelMapper
}

// NewGenericImporter 创建通用导入器
func NewGenericImporter[T any]() *GenericImporter[T] {
	return &GenericImporter[T]{
		parser: NewParser(),
		mapper: NewModelMapper(),
	}
}

// Import 导入数据
func (i *GenericImporter[T]) Import(ctx context.Context, file *multipart.FileHeader, userID uint, createFunc CreateFunc[T]) (*contracts.ImportResult, error) {
	result := &contracts.ImportResult{}

	// 创建回调函数
	callback := func(fileType FileType, content []byte, filename string) ([]interface{}, error) {
		var items []interface{}
		var err error

		// 获取 T 的类型
		var t T
		modelType := reflect.TypeOf(t)

		switch fileType {
		case FileTypeJson:
			logger.Info(&ctx, "GenericImporter: Processing JSON file %s, size: %d bytes", filename, len(content))
			items, err = i.mapper.MapFromJson(&ctx, content, modelType, userID)
		case FileTypeTxt, FileTypeMd:
			logger.Info(&ctx, "GenericImporter: Processing text file %s, size: %d bytes", filename, len(content))
			items, err = i.mapper.MapFromText(&ctx, content, filename, modelType, userID)
		default:
			logger.Warn(&ctx, "GenericImporter: Unsupported file type: %v", fileType)
			return nil, nil
		}

		if err != nil {
			logger.Error(&ctx, "GenericImporter: Failed to map content: %v", err)
			return nil, err
		}

		logger.Info(&ctx, "GenericImporter: Mapped %d items", len(items))
		return items, nil
	}

	// 解析文件
	items, err := i.parser.ParseWithCallback(file, callback)
	if err != nil {
		return nil, err
	}

	result.Total = len(items)

	// 保存数据
	for _, item := range items {
		entity, ok := item.(*T)
		if !ok {
			result.Failed++
			result.Errors = append(result.Errors, "invalid data type")
			continue
		}

		if err := createFunc(ctx, entity); err != nil {
			logger.Error(&ctx, "GenericImporter: Failed to create entity: %v", err)
			result.Failed++
			result.Errors = append(result.Errors, err.Error())
		} else {
			result.Success++
		}
	}

	return result, nil
}
