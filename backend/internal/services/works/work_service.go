package works

import (
	"novel-man/backend/internal/contracts/works"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

// WorkService 通过嵌入 GenericService 来复用代码
type WorkService struct {
	*services.GenericService[models.Work, int64, works.WorkRepository]
	repo works.WorkRepository
}

func NewWorkService(repo works.WorkRepository) works.WorkService {
	return &WorkService{
		GenericService: services.NewGenericService[models.Work, int64, works.WorkRepository](repo),
		repo:           repo,
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
