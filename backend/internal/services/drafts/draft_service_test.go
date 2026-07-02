package drafts

import (
	"testing"

	"novel-man/backend/internal/contracts/drafts"
	"novel-man/backend/internal/models"
	gormrepo "novel-man/backend/internal/repositories/gorm"
	ctxpkg "novel-man/backend/utils/context"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestDraftService_Publish_AssociatedWorkSoftDeletedReturnsBusinessError(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.Work{}, &models.Draft{}, &models.Chapter{}))

	workRepo := gormrepo.NewWorkGormRepository(db)
	draftRepo := gormrepo.NewDraftGormRepository(db)
	chapterRepo := gormrepo.NewChapterGormRepository(db)

	svc := NewDraftService(draftRepo, chapterRepo, workRepo, nil, nil)

	// create a work then soft-delete it
	work := &models.Work{ID: 1, UserID: 1, Title: "w", Status: "draft"}
	require.NoError(t, db.Create(work).Error)
	require.NoError(t, db.Delete(&models.Work{}, work.ID).Error)

	// draft still points to the deleted work
	draft := &models.Draft{UserID: 1, WorkID: &work.ID, Title: "d", Content: "", Status: "draft", WordCount: 1}
	require.NoError(t, db.Create(draft).Error)

	ctx := *ctxpkg.New()
	_, publishErr := svc.Publish(ctx, draft.ID)
	require.ErrorIs(t, publishErr, drafts.ErrAssociatedWorkNotFound)

	// ensure chapter was not created
	var chapterCount int64
	require.NoError(t, db.Model(&models.Chapter{}).Count(&chapterCount).Error)
	require.Equal(t, int64(0), chapterCount)
}

func TestDraftService_Publish_AssignsSequentialDisplayOrder(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.Work{}, &models.Draft{}, &models.Chapter{}))

	workRepo := gormrepo.NewWorkGormRepository(db)
	draftRepo := gormrepo.NewDraftGormRepository(db)
	chapterRepo := gormrepo.NewChapterGormRepository(db)
	svc := NewDraftService(draftRepo, chapterRepo, workRepo, nil, nil)

	work := &models.Work{ID: 1, UserID: 1, Title: "w", Status: "draft"}
	require.NoError(t, db.Create(work).Error)

	ctx := *ctxpkg.New()

	// 已有两章：display_order 1、2
	require.NoError(t, db.Create(&models.Chapter{WorkID: work.ID, Title: "c1", DisplayOrder: 1, Status: "published"}).Error)
	require.NoError(t, db.Create(&models.Chapter{WorkID: work.ID, Title: "c2", DisplayOrder: 2, Status: "published"}).Error)

	// 发布一篇草稿 → 应补为第 3 章（max+1）
	draft := &models.Draft{UserID: 1, WorkID: &work.ID, Title: "d3", Status: "draft", WordCount: 1}
	require.NoError(t, db.Create(draft).Error)
	ch, err := svc.Publish(ctx, draft.ID)
	require.NoError(t, err)
	require.Equal(t, 3, ch.DisplayOrder)

	// 删除第 2 章后再发布 → 应为 max(1,3)+1 = 4（若用 count+1 会得到 3 而撞号）
	require.NoError(t, db.Where("work_id = ? AND display_order = ?", work.ID, 2).Delete(&models.Chapter{}).Error)
	draft2 := &models.Draft{UserID: 1, WorkID: &work.ID, Title: "d4", Status: "draft", WordCount: 1}
	require.NoError(t, db.Create(draft2).Error)
	ch2, err := svc.Publish(ctx, draft2.ID)
	require.NoError(t, err)
	require.Equal(t, 4, ch2.DisplayOrder)
}
