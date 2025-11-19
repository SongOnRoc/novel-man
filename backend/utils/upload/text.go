package upload

import (
	"fmt"
	"io"
	"mime/multipart"
)

// TextParser 文本文件解析器 (支持 .txt 和 .md)
type TextParser struct{}

// Parse 解析文本文件
func (p *TextParser) Parse(file *multipart.FileHeader) ([]ParsedFile, error) {
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
		Type:    FileTypeTxt,
		Content: content,
	}

	return []ParsedFile{parsed}, nil
}

// SupportedTypes 返回支持的文件类型
func (p *TextParser) SupportedTypes() []FileType {
	return []FileType{FileTypeTxt, FileTypeMd}
}
