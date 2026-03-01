package upload

import "mime/multipart"

// FileType 文件类型枚举
type FileType string

const (
	FileTypeTxt  FileType = "txt"
	FileTypeMd   FileType = "md"
	FileTypeJson FileType = "json"
	FileTypeZip  FileType = "zip"
)

// ParsedFile 解析后的文件接口
type ParsedFile interface {
	GetName() string
	GetType() FileType
}

// RawParsedFile 原始解析文件（用于通用文件解析器）
type RawParsedFile struct {
	Name    string   `json:"name"`
	Type    FileType `json:"type"`
	Content []byte   `json:"content"`
}

func (r *RawParsedFile) GetName() string {
	return r.Name
}

func (r *RawParsedFile) GetType() FileType {
	return r.Type
}

func (r *RawParsedFile) GetContent() []byte {
	return r.Content
}

// FileParser 文件解析器接口
type FileParser interface {
	Parse(file *multipart.FileHeader) ([]ParsedFile, error)
	SupportedTypes() []FileType
}

// ContentCallback 内容处理回调函数类型
type ContentCallback func(fileType FileType, content []byte, filename string) ([]interface{}, error)

// ImportResult 导入结果
type ImportResult struct {
	Success int      `json:"success"`
	Failed  int      `json:"failed"`
	Total   int      `json:"total"`
	Errors  []string `json:"errors,omitempty"`
}
