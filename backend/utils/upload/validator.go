package upload

import (
	"errors"
	"mime/multipart"
	"path/filepath"
	"strings"
)

const (
	MaxFileSize    = 10 << 20  // 10MB
	MaxZipSize     = 50 << 20  // 50MB
	MaxUnzipSize   = 100 << 20 // 100MB
	MaxFilesInZip  = 100
)

var (
	ErrFileTooLarge    = errors.New("file size exceeds limit")
	ErrInvalidFileType = errors.New("invalid file type")
	ErrTooManyFiles    = errors.New("too many files in archive")
	ErrZipTooBig       = errors.New("unzipped content exceeds limit")
)

// FileValidator 文件验证器
type FileValidator struct {
	allowedTypes []FileType
	maxSize      int64
}

// NewFileValidator 创建文件验证器
func NewFileValidator(allowedTypes []FileType, maxSize int64) *FileValidator {
	return &FileValidator{
		allowedTypes: allowedTypes,
		maxSize:      maxSize,
	}
}

// Validate 验证文件
func (v *FileValidator) Validate(file *multipart.FileHeader) error {
	// 验证文件大小
	if file.Size > v.maxSize {
		return ErrFileTooLarge
	}

	// 验证文件类型
	ext := strings.TrimPrefix(filepath.Ext(file.Filename), ".")
	fileType := FileType(strings.ToLower(ext))

	allowed := false
	for _, t := range v.allowedTypes {
		if t == fileType {
			allowed = true
			break
		}
	}

	if !allowed {
		return ErrInvalidFileType
	}

	return nil
}

// ValidateFileType 验证文件类型是否在允许列表中
func ValidateFileType(filename string, allowedTypes []FileType) bool {
	ext := strings.TrimPrefix(filepath.Ext(filename), ".")
	fileType := FileType(strings.ToLower(ext))

	for _, t := range allowedTypes {
		if t == fileType {
			return true
		}
	}
	return false
}