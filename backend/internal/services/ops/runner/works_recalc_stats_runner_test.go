package runner

import (
	"fmt"
	"mime/multipart"
	"sync"
	"testing"
	"time"

	"novel-man/backend/internal/contracts"
	chapters_contract "novel-man/backend/internal/contracts/chapters"
	opsc "novel-man/backend/internal/contracts/ops"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	repo_gorm "novel-man/backend/internal/repositories/gorm"
	service_ops "novel-man/backend/internal/services/ops"
	service_works "novel-man/backend/internal/services/works"
	ctxpkg "novel-man/backend/utils/context"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestWorksRecalcStatsRunner_Start_NoPanic(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.OpsJob{}, &models.Work{}))

	jobsRepo := repo_gorm.NewOpsJobGormRepository(db)
	scanner := NewGormWorkScannerDB(db)
	scheduler := events.NewQueueScheduler()
	em := events.NewEventManager(scheduler)

	em.RegisterRoutes(events.EventTypeWorksRecalcStats, events.ModuleWorks)
	em.RegisterConsumer(events.ModuleWorks, func(ctx ctxpkg.Context, task events.QueueTask) error { return nil })

	runner := NewWorksRecalcStatsRunner(jobsRepo, scanner, em)
	runner.identity = "runner-test-start"
	runner.tickerInterval = 10 * time.Millisecond

	require.NotPanics(t, func() {
		runner.Start()
	})

	time.Sleep(20 * time.Millisecond)
}

type fakeChapterService struct {
	items []models.Chapter
}

func (s *fakeChapterService) Create(ctx ctxpkg.Context, entity *models.Chapter) error { return nil }
func (s *fakeChapterService) GetByID(ctx ctxpkg.Context, id uint) (*models.Chapter, error) {
	return nil, fmt.Errorf("not implemented")
}
func (s *fakeChapterService) Update(ctx ctxpkg.Context, id uint, entity *models.Chapter) error {
	return nil
}
func (s *fakeChapterService) Delete(ctx ctxpkg.Context, id uint) error { return nil }
func (s *fakeChapterService) List(ctx ctxpkg.Context, page, limit int, filters contracts.Filters) ([]models.Chapter, int64, error) {
	result := make([]models.Chapter, 0)
	for _, item := range s.items {
		if raw, ok := filters["work_id"]; ok {
			workID, ok := raw.(int64)
			if ok && item.WorkID != workID {
				continue
			}
		}
		result = append(result, item)
	}
	return result, int64(len(result)), nil
}
func (s *fakeChapterService) Import(ctx ctxpkg.Context, file *multipart.FileHeader, userID uint) (*contracts.ImportResult, error) {
	return nil, fmt.Errorf("not implemented")
}
func (s *fakeChapterService) HandleChapterTask(ctx ctxpkg.Context, task events.QueueTask) error {
	return nil
}

var _ chapters_contract.ChapterService = (*fakeChapterService)(nil)

func TestWorksRecalcStatsRunner_ActuallyUpdatesWorkStatsFromRealChapters(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:works_recalc_stats_runner_real?mode=memory&cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.OpsJob{}, &models.OpsJobLock{}, &models.Work{}))

	work := &models.Work{
		ID:                1,
		UserID:            1,
		Title:             "demo",
		Status:            "draft",
		TotalWordCount:    9999,
		TotalChapterCount: 77,
	}
	require.NoError(t, db.Create(work).Error)

	jobsRepo := repo_gorm.NewOpsJobGormRepository(db)
	locksRepo := repo_gorm.NewOpsJobLockGormRepository(db)
	opsSvc := service_ops.NewOpsService(jobsRepo, locksRepo)

	scheduler := events.NewQueueScheduler()
	em := events.NewEventManager(scheduler)
	chapterSvc := &fakeChapterService{items: []models.Chapter{
		{WorkID: 1, WordCount: 123},
		{WorkID: 1, WordCount: 456},
	}}
	workRepo := repo_gorm.NewWorkGormRepository(db)
	workSvc := service_works.NewWorkService(workRepo, chapterSvc, nil)

	em.RegisterRoutes(events.EventTypeWorksRecalcStats, events.ModuleWorks)
	em.RegisterConsumer(events.ModuleWorks, workSvc.HandleWorkStatsTask)

	ctx := *ctxpkg.New()
	job, err := opsSvc.CreateWorksRecalcStatsJob(ctx, 1, nil, nil, worksRecalcRequestAll())
	require.NoError(t, err)
	require.NotNil(t, job)

	runner := NewWorksRecalcStatsRunner(jobsRepo, NewGormWorkScannerDB(db), em)
	runner.identity = "runner-test-real-chapters"
	require.NoError(t, runner.tick(ctx))

	// 队列消费是异步的；等待 job finalize 与 works 统计写回完成。
	require.Eventually(t, func() bool {
		var gotJob models.OpsJob
		if err := db.Where("job_id = ?", job.JobID).First(&gotJob).Error; err != nil {
			return false
		}
		return gotJob.Status == models.OpsJobStatusSucceeded
	}, time.Second, 10*time.Millisecond)

	var gotJob models.OpsJob
	require.NoError(t, db.Where("job_id = ?", job.JobID).First(&gotJob).Error)
	require.Equal(t, models.OpsJobStatusSucceeded, gotJob.Status)
	require.Nil(t, gotJob.ErrorSummary)
	require.Equal(t, int64(1), gotJob.ProgressTotal)
	require.Equal(t, int64(1), gotJob.ProgressDone)
	require.Equal(t, int64(0), gotJob.ProgressFailed)

	var gotWork models.Work
	require.Eventually(t, func() bool {
		if err := db.First(&gotWork, work.ID).Error; err != nil {
			return false
		}
		return gotWork.TotalWordCount == 579 && gotWork.TotalChapterCount == 2
	}, time.Second, 10*time.Millisecond)
	require.Equal(t, 579, gotWork.TotalWordCount)
	require.Equal(t, 2, gotWork.TotalChapterCount)
}

func worksRecalcRequestAll() opsc.CreateWorksRecalcStatsJobRequest {
	return opsc.CreateWorksRecalcStatsJobRequest{Mode: opsc.CreateWorksRecalcStatsJobModeAll}
}

func TestWorksRecalcStatsRunner_FailsWhenConsumerMissing(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:works_recalc_stats_runner_missing_consumer?mode=memory&cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.OpsJob{}, &models.OpsJobLock{}, &models.Work{}))

	work := &models.Work{
		ID:                1,
		UserID:            1,
		Title:             "demo",
		Status:            "draft",
		TotalWordCount:    9999,
		TotalChapterCount: 77,
	}
	require.NoError(t, db.Create(work).Error)

	jobsRepo := repo_gorm.NewOpsJobGormRepository(db)
	locksRepo := repo_gorm.NewOpsJobLockGormRepository(db)
	opsSvc := service_ops.NewOpsService(jobsRepo, locksRepo)

	scheduler := events.NewQueueScheduler()
	em := events.NewEventManager(scheduler)
	em.RegisterRoutes(events.EventTypeWorksRecalcStats, events.ModuleWorks)

	ctx := *ctxpkg.New()
	job, err := opsSvc.CreateWorksRecalcStatsJob(ctx, 1, nil, nil, worksRecalcRequestAll())
	require.NoError(t, err)
	require.NotNil(t, job)

	runner := NewWorksRecalcStatsRunner(jobsRepo, NewGormWorkScannerDB(db), em)
	runner.identity = "runner-test-missing-consumer"
	err = runner.tick(ctx)
	require.NoError(t, err)

	require.Eventually(t, func() bool {
		var gotJob models.OpsJob
		if err := db.Where("job_id = ?", job.JobID).First(&gotJob).Error; err != nil {
			return false
		}
		return gotJob.Status == models.OpsJobStatusFailed
	}, time.Second, 10*time.Millisecond)

	var gotJob models.OpsJob
	require.NoError(t, db.Where("job_id = ?", job.JobID).First(&gotJob).Error)
	require.Equal(t, models.OpsJobStatusFailed, gotJob.Status)
	require.NotNil(t, gotJob.ErrorSummary)
	require.Contains(t, *gotJob.ErrorSummary, "missing consumer")
	require.Equal(t, int64(1), gotJob.ProgressTotal)
	require.Equal(t, int64(0), gotJob.ProgressDone)
	require.Equal(t, int64(1), gotJob.ProgressFailed)

	var gotWork models.Work
	require.NoError(t, db.First(&gotWork, work.ID).Error)
	require.Equal(t, 9999, gotWork.TotalWordCount)
	require.Equal(t, 77, gotWork.TotalChapterCount)
}

type spyChapterService struct {
	mu          sync.Mutex
	seenFilters []contracts.Filters
	items       []models.Chapter
}

func (s *spyChapterService) Create(ctx ctxpkg.Context, entity *models.Chapter) error { return nil }
func (s *spyChapterService) GetByID(ctx ctxpkg.Context, id uint) (*models.Chapter, error) {
	return nil, fmt.Errorf("not implemented")
}
func (s *spyChapterService) Update(ctx ctxpkg.Context, id uint, entity *models.Chapter) error {
	return nil
}
func (s *spyChapterService) Delete(ctx ctxpkg.Context, id uint) error { return nil }
func (s *spyChapterService) List(ctx ctxpkg.Context, page, limit int, filters contracts.Filters) ([]models.Chapter, int64, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	copied := contracts.Filters{}
	for k, v := range filters {
		copied[k] = v
	}
	s.seenFilters = append(s.seenFilters, copied)
	return append([]models.Chapter(nil), s.items...), int64(len(s.items)), nil
}
func (s *spyChapterService) Import(ctx ctxpkg.Context, file *multipart.FileHeader, userID uint) (*contracts.ImportResult, error) {
	return nil, fmt.Errorf("not implemented")
}
func (s *spyChapterService) HandleChapterTask(ctx ctxpkg.Context, task events.QueueTask) error {
	return nil
}

var _ chapters_contract.ChapterService = (*spyChapterService)(nil)

func TestHandleWorkStatsTask_UsesWorkIDFilterAndOverwritesHistoricalStats(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:works_recalc_stats_handle_stats?mode=memory&cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.Work{}))

	work := &models.Work{ID: 10, UserID: 1, Title: "demo", Status: "draft", TotalWordCount: 8888, TotalChapterCount: 66}
	require.NoError(t, db.Create(work).Error)

	chapterSvc := &spyChapterService{items: []models.Chapter{{WorkID: 10, WordCount: 100}, {WorkID: 10, WordCount: 200}}}
	workRepo := repo_gorm.NewWorkGormRepository(db)
	workSvc := service_works.NewWorkService(workRepo, chapterSvc, nil)

	err = workSvc.HandleWorkStatsTask(*ctxpkg.New(), events.QueueTask{Payload: map[string]any{"work_id": int64(10)}})
	require.NoError(t, err)

	chapterSvc.mu.Lock()
	require.Len(t, chapterSvc.seenFilters, 1)
	require.Equal(t, int64(10), chapterSvc.seenFilters[0]["work_id"])
	chapterSvc.mu.Unlock()

	var got models.Work
	require.NoError(t, db.First(&got, work.ID).Error)
	require.Equal(t, 300, got.TotalWordCount)
	require.Equal(t, 2, got.TotalChapterCount)
}
