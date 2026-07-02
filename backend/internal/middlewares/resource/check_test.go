package resource

import (
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/works"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	ctxpkg "novel-man/backend/utils/context"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

type fakeDraftService struct {
	Draft *models.Draft
	Err   error
}

func (s *fakeDraftService) Create(ctx ctxpkg.Context, entity *models.Draft) error { return nil }
func (s *fakeDraftService) GetByID(ctx ctxpkg.Context, id uint) (*models.Draft, error) {
	return s.Draft, s.Err
}
func (s *fakeDraftService) Update(ctx ctxpkg.Context, id uint, entity *models.Draft) error {
	return nil
}
func (s *fakeDraftService) Delete(ctx ctxpkg.Context, id uint) error { return nil }
func (s *fakeDraftService) List(ctx ctxpkg.Context, page, limit int, filters contracts.Filters) ([]models.Draft, int64, error) {
	return nil, 0, nil
}
func (s *fakeDraftService) Publish(ctx ctxpkg.Context, draftID uint) (*models.Chapter, error) {
	return nil, nil
}
func (s *fakeDraftService) HandleDraftTask(ctx ctxpkg.Context, task events.QueueTask) error {
	return nil
}
func (s *fakeDraftService) ImportDrafts(ctx ctxpkg.Context, file *multipart.FileHeader, userID uint, workID int64) (*contracts.ImportResult, error) {
	return nil, nil
}
func (s *fakeDraftService) PublishBatch(ctx ctxpkg.Context, draftIDs []uint) (*contracts.ImportResult, error) {
	return nil, nil
}

type fakeWorkService struct {
	Work *models.Work
	Err  error
}

func (s *fakeWorkService) Create(ctx ctxpkg.Context, entity *models.Work) error { return nil }
func (s *fakeWorkService) GetByID(ctx ctxpkg.Context, id int64) (*models.Work, error) {
	return s.Work, s.Err
}
func (s *fakeWorkService) Update(ctx ctxpkg.Context, id int64, entity *models.Work) error { return nil }
func (s *fakeWorkService) Delete(ctx ctxpkg.Context, id int64) error                      { return nil }
func (s *fakeWorkService) List(ctx ctxpkg.Context, page, limit int, filters contracts.Filters) ([]models.Work, int64, error) {
	return nil, 0, nil
}
func (s *fakeWorkService) Publish(ctx ctxpkg.Context, id int64) error { return nil }
func (s *fakeWorkService) Import(ctx ctxpkg.Context, file *multipart.FileHeader, userID uint) (*contracts.ImportResult, error) {
	return nil, nil
}
func (s *fakeWorkService) HandleWorkStatsTask(ctx ctxpkg.Context, task events.QueueTask) error {
	return nil
}
func (s *fakeWorkService) DeleteWithOptions(ctx ctxpkg.Context, id int64, opts works.DeleteWorkOptions) error {
	return nil
}

func TestCheckDraftOwnership_WorkSoftDeletedDoesNot500AndFallsBackToDraftUser(t *testing.T) {
	gin.SetMode(gin.TestMode)

	draftWorkID := int64(10)
	draft := &models.Draft{UserID: 7, WorkID: &draftWorkID}

	services := &AllServices{
		DraftService: &fakeDraftService{Draft: draft, Err: nil},
		WorkService:  &fakeWorkService{Work: nil, Err: gorm.ErrRecordNotFound},
	}

	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = httptest.NewRequest(http.MethodGet, "/drafts/1", nil)

	status, err := checkDraftOwnership(c, services, 1, 7)
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, status)
}

func TestCheckDraftOwnership_WorkSoftDeletedAndDraftUserMismatchReturns403(t *testing.T) {
	gin.SetMode(gin.TestMode)

	draftWorkID := int64(10)
	draft := &models.Draft{UserID: 7, WorkID: &draftWorkID}

	services := &AllServices{
		DraftService: &fakeDraftService{Draft: draft, Err: nil},
		WorkService:  &fakeWorkService{Work: nil, Err: gorm.ErrRecordNotFound},
	}

	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = httptest.NewRequest(http.MethodGet, "/drafts/1", nil)

	status, err := checkDraftOwnership(c, services, 1, 999)
	require.NoError(t, err)
	require.Equal(t, http.StatusForbidden, status)
}
