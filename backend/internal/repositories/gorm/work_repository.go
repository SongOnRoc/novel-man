package gorm

import (
	"fmt"

	"novel-man/backend/internal/contracts/works"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"

	"gorm.io/gorm"
)

// WorkGormRepository 通过嵌入 GenericGormRepository 来复用代码
type WorkGormRepository struct {
	*GenericGormRepository[models.Work, int64]
	db *gorm.DB
}

func NewWorkGormRepository(db *gorm.DB) works.WorkRepository {
	return &WorkGormRepository{
		GenericGormRepository: NewGenericGormRepository[models.Work, int64](db),
		db:                    db,
	}
}

func (r *WorkGormRepository) UpdateWorkStats(ctx context.Context, id int64, totalWordCount, totalChapterCount int) error {
	return r.db.WithContext(ctx).
		Model(&models.Work{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"total_word_count":    totalWordCount,
			"total_chapter_count": totalChapterCount,
		}).Error
}

func (r *WorkGormRepository) DeleteWithOptions(ctx context.Context, id int64, opts works.DeleteWorkOptions) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1) Work 存在性检查（软删视为不存在）
		var work models.Work
		if err := tx.First(&work, id).Error; err != nil {
			return err
		}

		// 2) 统计关联草稿数（仅统计未软删 drafts）
		var draftCount int64
		if err := tx.Model(&models.Draft{}).
			Where("work_id = ? AND deleted_at IS NULL", id).
			Count(&draftCount).Error; err != nil {
			return err
		}

		// 3) 分支处理（409 / 执行策略）
		if opts.DraftHandling == nil {
			if draftCount > 0 {
				return &works.DraftHandlingRequiredError{DraftCount: int(draftCount)}
			}
		} else {
			switch *opts.DraftHandling {
			case works.DraftHandlingUnlink:
				if err := tx.Model(&models.Draft{}).
					Where("work_id = ? AND deleted_at IS NULL", id).
					Update("work_id", nil).Error; err != nil {
					return err
				}
			case works.DraftHandlingDelete:
				if err := tx.Unscoped().
					Where("work_id = ? AND deleted_at IS NULL", id).
					Delete(&models.Draft{}).Error; err != nil {
					return err
				}
			default:
				return fmt.Errorf("invalid draftHandling: %s", *opts.DraftHandling)
			}
		}

		// 4) 软删 work
		return tx.Delete(&models.Work{}, id).Error
	})
}
