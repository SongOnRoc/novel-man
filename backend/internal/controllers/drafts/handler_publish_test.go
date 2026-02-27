package drafts

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/drafts"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	ctxpkg "novel-man/backend/utils/context"
	"novel-man/backend/utils/response"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

type fakeDraftPublishService struct {
	publishErr error
}

func (s *fakeDraftPublishService) Create(ctx ctxpkg.Context, entity *models.Draft) error { return nil }
func (s *fakeDraftPublishService) GetByID(ctx ctxpkg.Context, id uint) (*models.Draft, error) {
	return nil, gorm.ErrRecordNotFound
}
func (s *fakeDraftPublishService) Update(ctx ctxpkg.Context, id uint, entity *models.Draft) error {
	return nil
}
func (s *fakeDraftPublishService) Delete(ctx ctxpkg.Context, id uint) error { return nil }
func (s *fakeDraftPublishService) List(ctx ctxpkg.Context, page, limit int, filters contracts.Filters) ([]models.Draft, int64, error) {
	return nil, 0, nil
}
func (s *fakeDraftPublishService) Publish(ctx ctxpkg.Context, draftID uint) (*models.Chapter, error) {
	return nil, s.publishErr
}
func (s *fakeDraftPublishService) HandleDraftTask(ctx ctxpkg.Context, task events.QueueTask) error {
	return nil
}

func TestDraftController_PublishDraft_AssociatedWorkNotFoundMapsTo409(t *testing.T) {
	gin.SetMode(gin.TestMode)

	controller := NewDraftController(&fakeDraftPublishService{publishErr: drafts.ErrAssociatedWorkNotFound})

	rec := httptest.NewRecorder()
	_, r := gin.CreateTestContext(rec)
	r.POST("/drafts/:id/publish", controller.PublishDraft)

	req := httptest.NewRequest(http.MethodPost, "/drafts/1/publish", nil)
	r.ServeHTTP(rec, req)

	require.Equal(t, http.StatusConflict, rec.Code)

	var resp response.StandardResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
	require.Equal(t, http.StatusConflict, resp.Code)
}
