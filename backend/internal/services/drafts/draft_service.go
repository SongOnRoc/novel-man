package drafts

import (
	"errors"
	"novel-man/backend/internal/contracts/chapters"
	"novel-man/backend/internal/contracts/drafts"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

// DraftService 通过嵌入 GenericService 来复用代码
type DraftService struct {
	*services.GenericService[models.Draft, uint, drafts.DraftRepository]
	repo        drafts.DraftRepository
	chapterRepo chapters.ChapterRepository
}

func NewDraftService(repo drafts.DraftRepository, chapterRepo chapters.ChapterRepository) drafts.DraftService {
	return &DraftService{
		GenericService: services.NewGenericService[models.Draft, uint, drafts.DraftRepository](repo),
		repo:           repo,
		chapterRepo:    chapterRepo,
	}
}

func (s *DraftService) Publish(ctx context.Context, draftID uint) (*models.Chapter, error) {
	// 1. 获取草稿
	draft, err := s.repo.GetByID(ctx, draftID)
	if err != nil {
		return nil, err
	}
	if draft.WorkID == nil {
		return nil, errors.New("draft is not associated with a work")
	}

	// 2. 创建章节
	chapter := &models.Chapter{
		WorkID:    *draft.WorkID,
		Title:     draft.Title,
		Content:   draft.Content,
		WordCount: draft.WordCount,
		Status:    "published",
	}
	if err := s.chapterRepo.Create(ctx, chapter); err != nil {
		return nil, err
	}

	// 3. 删除草稿
	if err := s.repo.Delete(ctx, draftID); err != nil {
		// 如果删除失败，可能需要处理（例如，回滚章节创建），但这里简化处理
		return nil, err
	}

	return chapter, nil
}
