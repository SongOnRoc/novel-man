package upload

import (
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"
)

// Parser 文件解析器管理器
type Parser struct {
	parsers map[FileType]FileParser
}

// NewParser 创建解析器管理器
func NewParser() *Parser {
	p := &Parser{
		parsers: make(map[FileType]FileParser),
	}

	// 注册默认解析器
	p.Register(FileTypeTxt, &TextParser{})
	p.Register(FileTypeMd, &TextParser{})
	p.Register(FileTypeJson, &JSONParser{})
	p.Register(FileTypeZip, &ZipParser{})

	return p
}

// Register 注册文件类型解析器
func (p *Parser) Register(fileType FileType, parser FileParser) {
	p.parsers[fileType] = parser
}

// Parse 解析文件（返回原始文件内容）
func (p *Parser) Parse(file *multipart.FileHeader) ([]ParsedFile, error) {
	ext := strings.TrimPrefix(filepath.Ext(file.Filename), ".")
	fileType := FileType(strings.ToLower(ext))

	parser, ok := p.parsers[fileType]
	if !ok {
		return nil, fmt.Errorf("%w: %s", ErrInvalidFileType, fileType)
	}

	return parser.Parse(file)
}

// ParseWithCallback 解析文件并通过回调函数处理
func (p *Parser) ParseWithCallback(file *multipart.FileHeader, callback ContentCallback) ([]interface{}, error) {
	parsedFiles, err := p.Parse(file)
	if err != nil {
		return nil, err
	}

	var results []interface{}

	for _, pf := range parsedFiles {
		rawFile, ok := pf.(*RawParsedFile)
		if !ok {
			continue
		}

		items, err := callback(rawFile.Type, rawFile.Content, rawFile.Name)
		if err != nil {
			return nil, fmt.Errorf("failed to process %s: %w", rawFile.Name, err)
		}

		results = append(results, items...)
	}

	return results, nil
}

// SupportedTypes 返回支持的文件类型
func (p *Parser) SupportedTypes() []FileType {
	types := make([]FileType, 0, len(p.parsers))
	for t := range p.parsers {
		types = append(types, t)
	}
	return types
}
