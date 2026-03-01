package gorm

import (
	"testing"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
	ctxpkg "novel-man/backend/utils/context"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupChapterRepo(t *testing.T) *GenericGormRepository[models.Chapter, uint] {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.Chapter{}))

	return NewGenericGormRepository[models.Chapter, uint](db)
}

func seedChapters(t *testing.T, repo *GenericGormRepository[models.Chapter, uint]) {
	t.Helper()

	ctx := *ctxpkg.New()
	chapters := []models.Chapter{
		{WorkID: 1, Title: "w1-c1", Content: "a"},
		{WorkID: 2, Title: "w2-c1", Content: "b"},
		{WorkID: 1, Title: "w1-c2", Content: "c"},
	}

	for i := range chapters {
		err := repo.Create(ctx, &chapters[i])
		require.NoError(t, err)
	}
}

func TestGenericRepositoryList_ScalarFilterIsNormalizedToCondition(t *testing.T) {
	repo := setupChapterRepo(t)
	seedChapters(t, repo)

	ctx := *ctxpkg.New()
	items, total, err := repo.List(ctx, 1, 10, contracts.Filters{
		"work_id":                int64(1),
		contracts.FilterKeyOrder: "id asc",
	})
	require.NoError(t, err)
	require.Equal(t, int64(2), total)
	require.Len(t, items, 2)
	require.Equal(t, int64(1), items[0].WorkID)
	require.Equal(t, int64(1), items[1].WorkID)
	require.Less(t, items[0].ID, items[1].ID)
}

func TestGenericRepositoryList_ConditionFilterStillWorks(t *testing.T) {
	repo := setupChapterRepo(t)
	seedChapters(t, repo)

	ctx := *ctxpkg.New()
	items, total, err := repo.List(ctx, 1, 10, contracts.Filters{
		"query": contracts.NewCondition("work_id", int64(2)),
	})
	require.NoError(t, err)
	require.Equal(t, int64(1), total)
	require.Len(t, items, 1)
	require.Equal(t, int64(2), items[0].WorkID)
}

func TestGenericRepositoryList_OrderKeyIsSeparatedFromFilterNormalization(t *testing.T) {
	repo := setupChapterRepo(t)
	seedChapters(t, repo)

	ctx := *ctxpkg.New()
	items, total, err := repo.List(ctx, 1, 10, contracts.Filters{
		contracts.FilterKeyOrder: "id desc",
	})

	require.NoError(t, err)
	require.Equal(t, int64(3), total)
	require.Len(t, items, 3)
	require.Greater(t, items[0].ID, items[1].ID)
	require.Greater(t, items[1].ID, items[2].ID)
}
