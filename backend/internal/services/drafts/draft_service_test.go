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
