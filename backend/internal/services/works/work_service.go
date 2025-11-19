package works

import (
	"mime/multipart"
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/works"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

// WorkService 通过嵌入 GenericService 来复用代码
type WorkService struct {
	*services.GenericService[models.Work, int64, works.WorkRepository]
	repo     works.WorkRepository
	importer *WorkImporter
}

func NewWorkService(repo works.WorkRepository) works.WorkService {
	return &WorkService{
		GenericService: services.NewGenericService[models.Work, int64, works.WorkRepository](repo),
		repo:           repo,
		importer:       NewWorkImporter(),
	}
}

// 实现 Publish 特有方法
func (s *WorkService) Publish(ctx context.Context, id int64) error {
	// 实现发布逻辑
	work, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// 更新作品状态为已发布
	work.Status = "published"
	return s.Update(ctx, id, work)
}

// Import 导入作品
func (s *WorkService) Import(ctx context.Context, file *multipart.FileHeader, userID uint) (*contracts.ImportResult, error) {
	return s.importer.Import(ctx, file, userID, func(c context.Context, w *models.Work) error {
		w.UserID = userID // 确保作品属于当前用户
		return s.Create(c, w)
	})
}
