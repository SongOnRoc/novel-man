package gorm

import (
	"testing"
	"time"

	"novel-man/backend/internal/models"
	ctxpkg "novel-man/backend/utils/context"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestOpsJobRepo_TryStealLease_AcquiresWhenLeaseIsNil(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.OpsJob{}))

	repo := NewOpsJobGormRepository(db)
	ctx := *ctxpkg.New()

	now := time.Now()
	job := &models.OpsJob{
		JobID:           "job-nil-lease",
		JobType:         models.OpsJobTypeWorksRecalcStats,
		Status:          models.OpsJobStatusRunning,
		StartedAt:       &now,
		CreatedByUserID: 1,
		ProgressTotal:   0,
		ProgressDone:    0,
		ProgressFailed:  0,
	}
	require.NoError(t, repo.Create(ctx, job))

	lease := OpsJobLease{Owner: "runner-1", Token: "token-1"}
	ok, err := repo.TryStealLease(ctx, job.JobID, lease, 60*time.Second, now)
	require.NoError(t, err)
	require.True(t, ok)

	got, err := repo.GetByJobID(ctx, job.JobID)
	require.NoError(t, err)
	require.NotNil(t, got.LeaseOwner)
	require.NotNil(t, got.LeaseToken)
	require.NotNil(t, got.LeaseExpiresAt)
	require.Equal(t, lease.Owner, *got.LeaseOwner)
	require.Equal(t, lease.Token, *got.LeaseToken)
	require.True(t, got.LeaseExpiresAt.After(now))
}

func TestOpsJobRepo_UpdateProgress_AfterTryStealLease_OnJobCreatedByOpsService(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.OpsJob{}, &models.OpsJobLock{}))

	jobsRepo := NewOpsJobGormRepository(db)
	locksRepo := NewOpsJobLockGormRepository(db)
	ctx := *ctxpkg.New()

	now := time.Now()
	owner := "api"
	token := "api-token"
	acquired, err := locksRepo.AcquireOrSteal(ctx, models.OpsJobTypeWorksRecalcStats, owner, token, 60*time.Second, now)
	require.NoError(t, err)
	require.True(t, acquired)

	startedAt := now
	job := &models.OpsJob{
		JobID:           "job-progress-after-steal",
		JobType:         models.OpsJobTypeWorksRecalcStats,
		Status:          models.OpsJobStatusRunning,
		StartedAt:       &startedAt,
		CreatedByUserID: 1,
		ProgressTotal:   0,
		ProgressDone:    0,
		ProgressFailed:  0,
	}
	require.NoError(t, jobsRepo.Create(ctx, job))

	runnerLease := OpsJobLease{Owner: "runner-1", Token: "runner-token"}
	ok, err := jobsRepo.TryStealLease(ctx, job.JobID, runnerLease, 60*time.Second, now)
	require.NoError(t, err)
	require.True(t, ok)

	ok, err = jobsRepo.UpdateProgressMonotonic(ctx, job.JobID, runnerLease, 1, 0, now.Add(1*time.Second))
	require.NoError(t, err)
	require.True(t, ok)

	got, err := jobsRepo.GetByJobID(ctx, job.JobID)
	require.NoError(t, err)
	require.Equal(t, int64(1), got.ProgressDone)
}

func TestOpsJobRepo_TryStealLease_OnJobCreatedByOpsService(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.OpsJob{}, &models.OpsJobLock{}))

	jobsRepo := NewOpsJobGormRepository(db)
	locksRepo := NewOpsJobLockGormRepository(db)
	ctx := *ctxpkg.New()

	now := time.Now()
	owner := "api"
	token := "api-token"
	acquired, err := locksRepo.AcquireOrSteal(ctx, models.OpsJobTypeWorksRecalcStats, owner, token, 60*time.Second, now)
	require.NoError(t, err)
	require.True(t, acquired)

	startedAt := now
	job := &models.OpsJob{
		JobID:           "job-from-ops-service-shape",
		JobType:         models.OpsJobTypeWorksRecalcStats,
		Status:          models.OpsJobStatusRunning,
		StartedAt:       &startedAt,
		CreatedByUserID: 1,
		ProgressTotal:   0,
		ProgressDone:    0,
		ProgressFailed:  0,
	}
	require.NoError(t, jobsRepo.Create(ctx, job))

	runnerLease := OpsJobLease{Owner: "runner-1", Token: "runner-token"}
	ok, err := jobsRepo.TryStealLease(ctx, job.JobID, runnerLease, 60*time.Second, now)
	require.NoError(t, err)
	require.True(t, ok)

	ok, err = jobsRepo.RenewLease(ctx, job.JobID, runnerLease, 60*time.Second, now.Add(1*time.Second))
	require.NoError(t, err)
	require.True(t, ok)
}

func TestOpsJobRepo_RenewLeaseWhereProtection(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.OpsJob{}))

	repo := NewOpsJobGormRepository(db)
	ctx := *ctxpkg.New()

	now := time.Now()
	owner := "runner-1"
	token := "token-1"
	expiresAt := now.Add(30 * time.Second)

	job := &models.OpsJob{
		JobID:           "job-1",
		JobType:         models.OpsJobTypeWorksRecalcStats,
		Status:          models.OpsJobStatusRunning,
		StartedAt:       &now,
		LeaseOwner:      &owner,
		LeaseToken:      &token,
		LeaseExpiresAt:  &expiresAt,
		CreatedByUserID: 1,
		ProgressTotal:   0,
		ProgressDone:    0,
		ProgressFailed:  0,
	}
	require.NoError(t, repo.Create(ctx, job))

	// wrong token
	ok, err := repo.RenewLease(ctx, job.JobID, OpsJobLease{Owner: owner, Token: "bad"}, 60*time.Second, now)
	require.NoError(t, err)
	require.False(t, ok)

	// expired lease should not renew
	expiredNow := now.Add(31 * time.Second)
	ok, err = repo.RenewLease(ctx, job.JobID, OpsJobLease{Owner: owner, Token: token}, 60*time.Second, expiredNow)
	require.NoError(t, err)
	require.False(t, ok)

	// correct where
	ok, err = repo.RenewLease(ctx, job.JobID, OpsJobLease{Owner: owner, Token: token}, 60*time.Second, now)
	require.NoError(t, err)
	require.True(t, ok)
}
