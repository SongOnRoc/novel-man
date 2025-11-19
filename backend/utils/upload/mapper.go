package upload

import (
	"encoding/json"
	"fmt"
	"novel-man/backend/internal/logger"
	"novel-man/backend/utils/context"
	"path/filepath"
	"reflect"
	"strings"
)

// FieldTag 字段映射标签
const (
	TagJsonField = "json_field" // JSON字段名
	TagTextField = "text_field" // 文本内容映射
	TagDefault   = "default"    // 默认值
	TagRequired  = "required"   // 是否必填
)

// ModelMapper 模型映射器
type ModelMapper struct{}

// NewModelMapper 创建模型映射器
func NewModelMapper() *ModelMapper {
	return &ModelMapper{}
}

// MapFromJson 从JSON数据映射到模型切片
func (m *ModelMapper) MapFromJson(ctx *context.Context, content []byte, modelType reflect.Type, userID uint) ([]interface{}, error) {
	// 先解析为通用JSON数组
	var jsonData []map[string]interface{}
	if err := json.Unmarshal(content, &jsonData); err != nil {
		// 如果不是数组，尝试解析为单个对象
		var singleData map[string]interface{}
		if err := json.Unmarshal(content, &singleData); err != nil {
			logger.Error(ctx, "MapFromJson: Failed to parse JSON: %v", err)
			return nil, err
		}
		jsonData = []map[string]interface{}{singleData}
	}

	logger.Info(ctx, "MapFromJson: Processing %d JSON items", len(jsonData))
	var results []interface{}

	for i, data := range jsonData {
		logger.Debug(ctx, "MapFromJson: Processing item %d: %+v", i, data)

		model, err := m.createModelFromJsonData(ctx, data, modelType, userID)
		if err != nil {
			logger.Error(ctx, "MapFromJson: Failed to create model from item %d: %v", i, err)
			return nil, err
		}

		logger.Debug(ctx, "MapFromJson: Created model of type %T for item %d", model, i)
		results = append(results, model)
	}

	logger.Info(ctx, "MapFromJson: Successfully mapped %d items", len(results))
	return results, nil
}

// MapFromText 从文本内容映射到模型
func (m *ModelMapper) MapFromText(ctx *context.Context, content []byte, filename string, modelType reflect.Type, userID uint) ([]interface{}, error) {
	data := map[string]interface{}{
		"content": string(content),
		"title":   strings.TrimSuffix(filename, filepath.Ext(filename)),
	}

	model, err := m.createModelFromJsonData(ctx, data, modelType, userID)
	if err != nil {
		return nil, err
	}

	return []interface{}{model}, nil
}

// createModelFromJsonData 从JSON数据创建模型实例
func (m *ModelMapper) createModelFromJsonData(ctx *context.Context, data map[string]interface{}, modelType reflect.Type, userID uint) (interface{}, error) {
	// 创建模型实例
	modelPtr := reflect.New(modelType)
	modelValue := modelPtr.Elem()

	// 设置UserID
	userIDField := modelValue.FieldByName("UserID")
	if userIDField.IsValid() && userIDField.CanSet() {
		userIDField.SetUint(uint64(userID))
	}

	// 遍历模型字段
	// modelType is the type of the struct (T)
	for i := 0; i < modelType.NumField(); i++ {
		field := modelType.Field(i)
		fieldValue := modelValue.Field(i)

		if !fieldValue.CanSet() {
			continue
		}

		// 处理字段标签
		if err := m.mapField(data, field, fieldValue); err != nil {
			return nil, err
		}
	}

	// 验证必填字段
	if err := m.validateRequiredFields(ctx, modelValue, modelType, data); err != nil {
		return nil, err
	}

	return modelPtr.Interface(), nil
}

// validateRequiredFields 验证必填字段是否存在
func (m *ModelMapper) validateRequiredFields(ctx *context.Context, modelValue reflect.Value, modelType reflect.Type, data map[string]interface{}) error {
	for i := 0; i < modelType.NumField(); i++ {
		field := modelType.Field(i)

		// 检查gorm标签中是否包含not null
		gormTag := field.Tag.Get("gorm")
		if !strings.Contains(gormTag, "not null") {
			continue
		}

		// 获取json_field标签或json标签
		jsonField := field.Tag.Get("json_field")
		if jsonField == "" {
			jsonTag := field.Tag.Get("json")
			if jsonTag != "" {
				jsonField = strings.Split(jsonTag, ",")[0]
			}
		}

		// 如果没有json标签，使用字段名
		if jsonField == "" {
			jsonField = field.Name
		}

		// 检查JSON数据中是否存在该字段
		if _, exists := data[jsonField]; !exists {
			// 检查字段是否有默认值或者是否为UserID(已经设置)
			if field.Name == "UserID" || strings.Contains(gormTag, "default:") {
				continue
			}
			// 记录详细的错误日志
			logger.Warn(ctx, "validateRequiredFields: Required field '%s' is missing in JSON data for model %s", jsonField, modelType.Name())
			return fmt.Errorf("invalid data")
		}
	}

	return nil
}

// mapField 映射单个字段
func (m *ModelMapper) mapField(data map[string]interface{}, field reflect.StructField, fieldValue reflect.Value) error {
	// 获取JSON字段名标签
	jsonField := field.Tag.Get(TagJsonField)
	if jsonField == "" {
		return nil
	}

	// 获取字段值
	value, exists := data[jsonField]
	if !exists {
		// 检查是否有默认值
		if defaultValue := field.Tag.Get(TagDefault); defaultValue != "" {
			return m.setFieldValue(fieldValue, defaultValue)
		}
		return nil
	}

	// 设置字段值
	return m.setFieldValue(fieldValue, value)
}

// setFieldValue 设置字段值
func (m *ModelMapper) setFieldValue(fieldValue reflect.Value, value interface{}) error {
	// 处理不同类型的转换
	switch fieldValue.Kind() {
	case reflect.String:
		if str, ok := value.(string); ok {
			fieldValue.SetString(str)
		}
	case reflect.Uint:
		if num, ok := value.(float64); ok {
			fieldValue.SetUint(uint64(num))
		}
	case reflect.Slice:
		if fieldValue.Type().Elem().Kind() == reflect.String {
			if slice, ok := value.([]interface{}); ok {
				strSlice := make([]string, len(slice))
				for i, item := range slice {
					if str, ok := item.(string); ok {
						strSlice[i] = str
					}
				}
				fieldValue.Set(reflect.ValueOf(strSlice))
			}
		}
	}

	return nil
}
