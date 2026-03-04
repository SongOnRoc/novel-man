package ops

import (
	"testing"

	opsc "novel-man/backend/internal/contracts/ops"
	"novel-man/backend/internal/models"
	repo_gorm "novel-man/backend/internal/repositories/gorm"
	ctxpkg "novel-man/backend/utils/context"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupOpsService(t *testing.T) (*opsService, *gorm.DB, func()) {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	require.NoError(t, db.AutoMigrate(&models.OpsJob{}, &models.OpsJobLock{}))

	jobsRepo := repo_gorm.NewOpsJobGormRepository(db)
	locksRepo := repo_gorm.NewOpsJobLockGormRepository(db)

	svc := NewOpsService(jobsRepo, locksRepo).(*opsService)
	return svc, db, func() {}
}

func TestOpsService_CreateWorksRecalcStatsJob_ConflictWhenLockNotAcquired(t *testing.T) {
	svc, _, _ := setupOpsService(t)
	ctx := *ctxpkg.New()

	job1, err := svc.CreateWorksRecalcStatsJob(ctx, 1, nil, nil, opsc.CreateWorksRecalcStatsJobRequest{
		Mode: opsc.CreateWorksRecalcStatsJobModeAll,
	})
	require.NoError(t, err)
	require.NotNil(t, job1)
	require.Equal(t, models.OpsJobTypeWorksRecalcStats, job1.JobType)
	require.Equal(t, models.OpsJobStatusRunning, job1.Status)

	job2, err := svc.CreateWorksRecalcStatsJob(ctx, 2, nil, nil, opsc.CreateWorksRecalcStatsJobRequest{
		Mode: opsc.CreateWorksRecalcStatsJobModeAll,
	})
	require.Error(t, err)
	require.Nil(t, job2)
	require.Contains(t, err.Error(), "job already running")
}

func TestOpsService_RequestCancel_OnlyUpdatesRunningJob(t *testing.T) {
	svc, db, _ := setupOpsService(t)
	ctx := *ctxpkg.New()

	job, err := svc.CreateWorksRecalcStatsJob(ctx, 1, nil, nil, opsc.CreateWorksRecalcStatsJobRequest{
		Mode: opsc.CreateWorksRecalcStatsJobModeAll,
	})
	require.NoError(t, err)

	requested, err := svc.RequestCancel(ctx, job.JobID, 9, "stop")
	require.NoError(t, err)
	require.True(t, requested)

	got, err := svc.GetJob(ctx, job.JobID)
	require.NoError(t, err)
	require.NotNil(t, got.CancelRequestedAt)
	require.NotNil(t, got.CanceledByUserID)
	require.Equal(t, uint(9), *got.CanceledByUserID)
	require.NotNil(t, got.CancelReason)
	require.Equal(t, "stop", *got.CancelReason)

	// 将状态改为非 running，再次 cancel 不应生效
	require.NoError(t, db.WithContext(ctx).Model(&models.OpsJob{}).
		Where("job_id = ?", job.JobID).
		Updates(map[string]any{"status": models.OpsJobStatusSucceeded}).Error)

	requested2, err := svc.RequestCancel(ctx, job.JobID, 10, "stop2")
	require.NoError(t, err)
	require.False(t, requested2)
}
