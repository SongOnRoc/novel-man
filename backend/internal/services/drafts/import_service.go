package drafts

import (
	"errors"
	"mime/multipart"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/drafts"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/upload"

	"gorm.io/gorm"
)

// ImportDrafts 将上传文件批量导入为作品草稿。
// 严格遵守"章节只能由草稿发布"的业务铁律：导入仅生成草稿，绝不直接生成章节；
// 用户随后可在草稿列表勾选并批量发布为章节。
func (s *DraftService) ImportDrafts(ctx context.Context, file *multipart.FileHeader, userID uint, workID int64) (*contracts.ImportResult, error) {
	// 校验作品归属（软删视为不存在），防止越权写入他人作品。
	work, err := s.workRepo.GetByID(ctx, workID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, drafts.ErrAssociatedWorkNotFound
		}
		return nil, err
	}
	if work.UserID != userID {
		return nil, drafts.ErrWorkPermissionDenied
	}

	importer := upload.NewGenericImporter[models.Draft]()
	return importer.Import(ctx, file, userID, func(c context.Context, d *models.Draft) error {
		wid := workID
		d.UserID = userID
		d.WorkID = &wid
		if d.Status == "" {
			d.Status = "draft"
		}
		if d.WordCount == 0 {
			d.WordCount = len([]rune(d.Content))
		}
		return s.repo.Create(c, d)
	})
}

// PublishBatch 批量发布草稿为章节，逐个调用 Publish 并汇总结果（部分成功语义）。
// 单篇失败不阻断其余篇章，失败原因收集到 Errors 中返回。
func (s *DraftService) PublishBatch(ctx context.Context, draftIDs []uint) (*contracts.ImportResult, error) {
	result := &contracts.ImportResult{Total: len(draftIDs)}
	for _, id := range draftIDs {
		if _, err := s.Publish(ctx, id); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, err.Error())
			continue
		}
		result.Success++
	}
	return result, nil
}
