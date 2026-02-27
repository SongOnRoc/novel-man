package gorm

import (
	"testing"

	"novel-man/backend/internal/contracts/works"
	"novel-man/backend/internal/models"
	ctxpkg "novel-man/backend/utils/context"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupWorkRepo(t *testing.T) (*gorm.DB, works.WorkRepository) {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.Work{}, &models.Draft{}))

	repo := NewWorkGormRepository(db)
	return db, repo
}

func createWork(t *testing.T, db *gorm.DB, id int64) models.Work {
	t.Helper()

	work := models.Work{
		ID:     id,
		UserID: 1,
		Title:  "work",
		Status: "draft",
	}
	require.NoError(t, db.Create(&work).Error)
	return work
}

func createDrafts(t *testing.T, db *gorm.DB, count int, workID *int64) []models.Draft {
	t.Helper()

	drafts := make([]models.Draft, 0, count)
	for i := 0; i < count; i++ {
		draft := models.Draft{
			UserID:    1,
			WorkID:    workID,
			Title:     "draft",
			Content:   "",
			Status:    "draft",
			WordCount: 0,
		}
		require.NoError(t, db.Create(&draft).Error)
		drafts = append(drafts, draft)
	}
	return drafts
}

func TestWorkRepository_DeleteWithOptions_NoDrafts_OmittedHandlingSoftDeletesWork(t *testing.T) {
	db, repo := setupWorkRepo(t)
	work := createWork(t, db, 1)

	ctx := *ctxpkg.New()
	err := repo.DeleteWithOptions(ctx, work.ID, works.DeleteWorkOptions{})
	require.NoError(t, err)

	var got models.Work
	err = db.First(&got, work.ID).Error
	require.ErrorIs(t, err, gorm.ErrRecordNotFound)

	err = db.Unscoped().First(&got, work.ID).Error
	require.NoError(t, err)
	require.True(t, got.DeletedAt.Valid)
}

func TestWorkRepository_DeleteWithOptions_WithDrafts_OmittedHandlingReturns409ErrorAndDoesNotDeleteWork(t *testing.T) {
	db, repo := setupWorkRepo(t)
	work := createWork(t, db, 1)
	createDrafts(t, db, 2, &work.ID)

	ctx := *ctxpkg.New()
	err := repo.DeleteWithOptions(ctx, work.ID, works.DeleteWorkOptions{})

	var requiredErr *works.DraftHandlingRequiredError
	require.ErrorAs(t, err, &requiredErr)
	require.Equal(t, 2, requiredErr.DraftCount)

	var got models.Work
	require.NoError(t, db.First(&got, work.ID).Error)
	require.False(t, got.DeletedAt.Valid)

	var draftCount int64
	require.NoError(t, db.Model(&models.Draft{}).Where("work_id = ?", work.ID).Count(&draftCount).Error)
	require.Equal(t, int64(2), draftCount)
}

func TestWorkRepository_DeleteWithOptions_UnlinkUnlinksDraftsAndSoftDeletesWork(t *testing.T) {
	db, repo := setupWorkRepo(t)
	work := createWork(t, db, 1)
	createDrafts(t, db, 2, &work.ID)

	handling := works.DraftHandlingUnlink
	ctx := *ctxpkg.New()
	err := repo.DeleteWithOptions(ctx, work.ID, works.DeleteWorkOptions{DraftHandling: &handling})
	require.NoError(t, err)

	var got models.Work
	require.ErrorIs(t, db.First(&got, work.ID).Error, gorm.ErrRecordNotFound)

	err = db.Unscoped().First(&got, work.ID).Error
	require.NoError(t, err)
	require.True(t, got.DeletedAt.Valid)

	var drafts []models.Draft
	require.NoError(t, db.Where("deleted_at IS NULL").Find(&drafts).Error)
	require.Len(t, drafts, 2)
	for i := range drafts {
		require.Nil(t, drafts[i].WorkID)
	}
}

func TestWorkRepository_DeleteWithOptions_DeleteHardDeletesDraftsAndSoftDeletesWork(t *testing.T) {
	db, repo := setupWorkRepo(t)
	work := createWork(t, db, 1)
	createDrafts(t, db, 2, &work.ID)

	handling := works.DraftHandlingDelete
	ctx := *ctxpkg.New()
	err := repo.DeleteWithOptions(ctx, work.ID, works.DeleteWorkOptions{DraftHandling: &handling})
	require.NoError(t, err)

	var draftCount int64
	require.NoError(t, db.Unscoped().Model(&models.Draft{}).Count(&draftCount).Error)
	require.Equal(t, int64(0), draftCount)

	var got models.Work
	require.ErrorIs(t, db.First(&got, work.ID).Error, gorm.ErrRecordNotFound)

	err = db.Unscoped().First(&got, work.ID).Error
	require.NoError(t, err)
	require.True(t, got.DeletedAt.Valid)
}
