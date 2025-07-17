package worldview

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"novel-man/backend/internal/apps/auth"
)

// setupTestDB 初始化一个用于测试的内存数据库
func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}
	err = db.AutoMigrate(&auth.User{}, &WorldviewCategory{}, &WorldviewSetting{})
	if err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}
	return db
}

// setupTestRouter 设置一个用于测试的 Gin 路由器
func setupTestRouter(db *gorm.DB, userID uint) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.Use(func(c *gin.Context) {
		c.Set("userID", userID)
		c.Set("db", db)
		c.Next()
	})
	worldviewRoutes := router.Group("/worldview")
	RegisterRoutes(worldviewRoutes)
	return router
}

func TestCategoryEndpoints(t *testing.T) {
	db := setupTestDB(t)
	testUser := auth.User{Username: "testuser"}
	db.Create(&testUser)
	otherUser := auth.User{Username: "otheruser"}
	db.Create(&otherUser)
	router := setupTestRouter(db, testUser.ID)

	var createdCategory WorldviewCategory

	t.Run("CreateCategory - Success", func(t *testing.T) {
		payload := `{"name": "Test Category"}`
		req, _ := http.NewRequest(http.MethodPost, "/worldview/categories", bytes.NewBufferString(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		json.Unmarshal(w.Body.Bytes(), &createdCategory)
		assert.Equal(t, "Test Category", createdCategory.Name)
		assert.Equal(t, testUser.ID, createdCategory.UserID)
	})

	t.Run("CreateCategory - Invalid JSON", func(t *testing.T) {
		payload := `{"name": "Test Category"`
		req, _ := http.NewRequest(http.MethodPost, "/worldview/categories", bytes.NewBufferString(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("GetCategories", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/worldview/categories", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
		var categories []WorldviewCategory
		json.Unmarshal(w.Body.Bytes(), &categories)
		assert.Len(t, categories, 1)
	})

	t.Run("UpdateCategory - Success", func(t *testing.T) {
		payload := `{"name": "Updated Category"}`
		url := fmt.Sprintf("/worldview/categories/%d", createdCategory.ID)
		req, _ := http.NewRequest(http.MethodPut, url, bytes.NewBufferString(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("UpdateCategory - Not Owned", func(t *testing.T) {
		otherRouter := setupTestRouter(db, otherUser.ID)
		payload := `{"name": "Updated Category"}`
		url := fmt.Sprintf("/worldview/categories/%d", createdCategory.ID)
		req, _ := http.NewRequest(http.MethodPut, url, bytes.NewBufferString(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		otherRouter.ServeHTTP(w, req)
		assert.Equal(t, http.StatusNotFound, w.Code) // Should be 404 as it's not found for this user
	})

	t.Run("UpdateCategory - Invalid ID", func(t *testing.T) {
		payload := `{"name": "Updated Category"}`
		req, _ := http.NewRequest(http.MethodPut, "/worldview/categories/abc", bytes.NewBufferString(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("UpdateCategory - Not Found", func(t *testing.T) {
		payload := `{"name": "Updated Category"}`
		req, _ := http.NewRequest(http.MethodPut, "/worldview/categories/999", bytes.NewBufferString(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("DeleteCategory - Not Owned", func(t *testing.T) {
		otherRouter := setupTestRouter(db, otherUser.ID)
		url := fmt.Sprintf("/worldview/categories/%d", createdCategory.ID)
		req, _ := http.NewRequest(http.MethodDelete, url, nil)
		w := httptest.NewRecorder()
		otherRouter.ServeHTTP(w, req)
		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("DeleteCategory - Success", func(t *testing.T) {
		url := fmt.Sprintf("/worldview/categories/%d", createdCategory.ID)
		req, _ := http.NewRequest(http.MethodDelete, url, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusNoContent, w.Code)
	})

	t.Run("DeleteCategory - Invalid ID", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodDelete, "/worldview/categories/abc", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("DeleteCategory - Not Found", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodDelete, "/worldview/categories/999", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestSettingEndpoints(t *testing.T) {
	db := setupTestDB(t)
	testUser := auth.User{Username: "testuser"}
	db.Create(&testUser)
	otherUser := auth.User{Username: "otheruser"}
	db.Create(&otherUser)
	testCategory := WorldviewCategory{Name: "Test Category", UserID: testUser.ID}
	db.Create(&testCategory)
	otherCategory := WorldviewCategory{Name: "Other Category", UserID: otherUser.ID}
	db.Create(&otherCategory)

	router := setupTestRouter(db, testUser.ID)
	var createdSetting WorldviewSetting

	t.Run("CreateSetting - Success", func(t *testing.T) {
		payload := fmt.Sprintf(`{"name": "Test Setting", "description": "Desc", "category_id": %d}`, testCategory.ID)
		req, _ := http.NewRequest(http.MethodPost, "/worldview/settings", bytes.NewBufferString(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusCreated, w.Code)
		json.Unmarshal(w.Body.Bytes(), &createdSetting)
		assert.Equal(t, "Test Setting", createdSetting.Name)
	})

	t.Run("CreateSetting - Invalid CategoryID", func(t *testing.T) {
		payload := `{"name": "Test Setting", "description": "Desc", "category_id": 999}`
		req, _ := http.NewRequest(http.MethodPost, "/worldview/settings", bytes.NewBufferString(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("CreateSetting - Category Not Owned by User", func(t *testing.T) {
		payload := fmt.Sprintf(`{"name": "Test Setting", "description": "Desc", "category_id": %d}`, otherCategory.ID)
		req, _ := http.NewRequest(http.MethodPost, "/worldview/settings", bytes.NewBufferString(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("GetSettings - All", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/worldview/settings", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
		var settings []WorldviewSetting
		json.Unmarshal(w.Body.Bytes(), &settings)
		assert.Len(t, settings, 1)
	})

	t.Run("GetSettings - By Category", func(t *testing.T) {
		url := fmt.Sprintf("/worldview/settings?category_id=%d", testCategory.ID)
		req, _ := http.NewRequest(http.MethodGet, url, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
		var settings []WorldviewSetting
		json.Unmarshal(w.Body.Bytes(), &settings)
		assert.Len(t, settings, 1)
	})

	t.Run("GetSettings - By Invalid Category", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/worldview/settings?category_id=abc", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
		var settings []WorldviewSetting
		json.Unmarshal(w.Body.Bytes(), &settings)
		assert.Len(t, settings, 1) // Should ignore invalid category_id and return all
	})

	t.Run("GetSetting - Success", func(t *testing.T) {
		url := fmt.Sprintf("/worldview/settings/%d", createdSetting.ID)
		req, _ := http.NewRequest(http.MethodGet, url, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
		var setting WorldviewSetting
		json.Unmarshal(w.Body.Bytes(), &setting)
		assert.Equal(t, "Test Setting", setting.Name)
	})

	t.Run("GetSetting - Not Found", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/worldview/settings/999", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("UpdateSetting - Success", func(t *testing.T) {
		payload := fmt.Sprintf(`{"name": "Updated Setting", "description": "Updated Desc", "category_id": %d}`, testCategory.ID)
		url := fmt.Sprintf("/worldview/settings/%d", createdSetting.ID)
		req, _ := http.NewRequest(http.MethodPut, url, bytes.NewBufferString(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
		var setting WorldviewSetting
		json.Unmarshal(w.Body.Bytes(), &setting)
		assert.Equal(t, "Updated Setting", setting.Name)
	})

	t.Run("UpdateSetting - Invalid CategoryID", func(t *testing.T) {
		payload := `{"name": "Updated", "description": "Updated", "category_id": 999}`
		url := fmt.Sprintf("/worldview/settings/%d", createdSetting.ID)
		req, _ := http.NewRequest(http.MethodPut, url, bytes.NewBufferString(payload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("DeleteSetting - Not Found", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodDelete, "/worldview/settings/999", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}