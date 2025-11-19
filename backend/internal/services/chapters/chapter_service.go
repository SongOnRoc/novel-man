package chapters

import (
	"mime/multipart"
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/chapters"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

// ChapterService 通过嵌入 GenericService 来复用代码
type ChapterService struct {
	*services.GenericService[models.Chapter, uint, chapters.ChapterRepository]
	repo     chapters.ChapterRepository
	importer *ChapterImporter
}

func NewChapterService(repo chapters.ChapterRepository) chapters.ChapterService {
	return &ChapterService{
		GenericService: services.NewGenericService[models.Chapter, uint, chapters.ChapterRepository](repo),
		repo:           repo,
		importer:       NewChapterImporter(),
	}
}

// Import 导入章节
func (s *ChapterService) Import(ctx context.Context, file *multipart.FileHeader, userID uint) (*contracts.ImportResult, error) {
	// 从 context 中获取 workID，这通常由路由参数提供
	// 注意：这里假设 controller 会将 workID 放入 context 或通过其他方式传递
	// 但 GenericImporter 的 Import 方法签名固定，所以我们可能需要从 file header 或其他地方获取，或者在 controller 层处理
	// 这里的 Import 接口签名是 (ctx, file, userID)，没有 workID。
	// 这是一个问题。我们需要在 controller 中解析 workID，然后传递给 service。
	// 但是 contracts.Importer 接口定义是 Import(ctx context.Context, file *multipart.FileHeader, userID uint) (*ImportResult, error)
	// 我们可以将 workID 放入 context 中传递。

	return s.importer.Import(ctx, file, userID, func(c context.Context, ch *models.Chapter) error {
		// 从 context 获取 workID
		if workID, ok := c.Value("workID").(uint); ok {
			ch.WorkID = int64(workID)
		}
		return s.Create(c, ch)
	})
}
