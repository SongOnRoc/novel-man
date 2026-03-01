package upload

import (
	"fmt"
	"io"
	"mime/multipart"
)

// JSONParser JSON 文件解析器
type JSONParser struct{}

// Parse 解析 JSON 文件
func (p *JSONParser) Parse(file *multipart.FileHeader) ([]ParsedFile, error) {
	f, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer f.Close()

	content, err := io.ReadAll(f)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	parsed := &RawParsedFile{
		Name:    file.Filename,
		Type:    FileTypeJson,
		Content: content,
	}

	return []ParsedFile{parsed}, nil
}

// SupportedTypes 返回支持的文件类型
func (p *JSONParser) SupportedTypes() []FileType {
	return []FileType{FileTypeJson}
}
