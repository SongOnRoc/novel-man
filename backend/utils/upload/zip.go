package upload

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"strings"
)

// ZipParser ZIP 文件解析器
type ZipParser struct{}

// Parse 解析 ZIP 文件
func (p *ZipParser) Parse(file *multipart.FileHeader) ([]ParsedFile, error) {
	f, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open zip file: %w", err)
	}
	defer f.Close()

	content, err := io.ReadAll(f)
	if err != nil {
		return nil, fmt.Errorf("failed to read zip file: %w", err)
	}

	zipReader, err := zip.NewReader(bytes.NewReader(content), int64(len(content)))
	if err != nil {
		return nil, fmt.Errorf("failed to create zip reader: %w", err)
	}

	if len(zipReader.File) > MaxFilesInZip {
		return nil, ErrTooManyFiles
	}

	var parsedFiles []ParsedFile
	var totalSize int64

	for _, zipFile := range zipReader.File {
		if zipFile.FileInfo().IsDir() {
			continue
		}

		totalSize += int64(zipFile.UncompressedSize64)
		if totalSize > MaxUnzipSize {
			return nil, ErrZipTooBig
		}

		ext := strings.TrimPrefix(filepath.Ext(zipFile.Name), ".")
		fileType := FileType(strings.ToLower(ext))

		// 只处理支持的文件类型
		if !ValidateFileType(zipFile.Name, []FileType{
			FileTypeTxt,
			FileTypeMd,
			FileTypeJson,
		}) {
			continue
		}

		rc, err := zipFile.Open()
		if err != nil {
			continue
		}

		fileContent, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			continue
		}

		parsedFiles = append(parsedFiles, &RawParsedFile{
			Name:    filepath.Base(zipFile.Name),
			Type:    fileType,
			Content: fileContent,
		})
	}

	return parsedFiles, nil
}

// SupportedTypes 返回支持的文件类型
func (p *ZipParser) SupportedTypes() []FileType {
	return []FileType{FileTypeZip}
}
