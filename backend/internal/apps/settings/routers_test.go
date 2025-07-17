package settings

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"novel-man/backend/internal/apps/auth"
	"novel-man/backend/internal/db"
)

// setup a test environment with an in-memory sqlite database
func setupTest(t *testing.T) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	gormDB, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open gorm db: %v", err)
	}
	db.DB = gormDB

	// Migrate the schema
	err = db.DB.AutoMigrate(&UserSetting{}, &auth.User{})
	if err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	RegisterRoutes(r.Group(""))
	return r
}

func TestSettingsHandlers(t *testing.T) {
	setupTest(t)

	// Create a test user
	testUser := auth.User{Username: "testuser", Email: "test@example.com"}
	db.DB.Create(&testUser)

	t.Run("GetSettings - Not Found (Default)", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest(http.MethodGet, "/settings", nil)
		
		// Manually create context and set user
		c, _ := gin.CreateTestContext(w)
		c.Request = req
		c.Set("user", testUser)

		getSettingsHandler(c)

		assert.Equal(t, http.StatusOK, w.Code)
		var body gin.H
		json.Unmarshal(w.Body.Bytes(), &body)
		assert.Equal(t, "default-gpt-3.5", body["ai_model"])
	})

	t.Run("UpsertSettings - Create", func(t *testing.T) {
		w := httptest.NewRecorder()
		input := gin.H{
			"ai_model": "gpt-4",
			"custom_api_endpoint": "https://api.example.com",
			"editor_theme": "dark",
		}
		body, _ := json.Marshal(input)
		req, _ := http.NewRequest(http.MethodPut, "/settings", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		c, _ := gin.CreateTestContext(w)
		c.Request = req
		c.Set("user", testUser)

		upsertSettingsHandler(c)

		assert.Equal(t, http.StatusOK, w.Code)
		var resBody gin.H
		json.Unmarshal(w.Body.Bytes(), &resBody)
		assert.Equal(t, input["ai_model"], resBody["ai_model"])

		// Verify in DB
		var setting UserSetting
		db.DB.Where("user_id = ?", testUser.ID).First(&setting)
		assert.Equal(t, input["ai_model"], setting.AIModel)
	})

	t.Run("GetSettings - Found", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest(http.MethodGet, "/settings", nil)
		
		c, _ := gin.CreateTestContext(w)
		c.Request = req
		c.Set("user", testUser)

		getSettingsHandler(c)

		assert.Equal(t, http.StatusOK, w.Code)
		var body gin.H
		json.Unmarshal(w.Body.Bytes(), &body)
		assert.Equal(t, "gpt-4", body["ai_model"])
	})

	t.Run("UpsertSettings - Update", func(t *testing.T) {
		w := httptest.NewRecorder()
		input := gin.H{"ai_model": "gpt-4-turbo"}
		body, _ := json.Marshal(input)
		req, _ := http.NewRequest(http.MethodPut, "/settings", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		c, _ := gin.CreateTestContext(w)
		c.Request = req
		c.Set("user", testUser)

		upsertSettingsHandler(c)

		assert.Equal(t, http.StatusOK, w.Code)

		// Verify in DB
		var setting UserSetting
		db.DB.Where("user_id = ?", testUser.ID).First(&setting)
		assert.Equal(t, "gpt-4-turbo", setting.AIModel)
	})

	t.Run("GetSettings - Unauthorized", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		// No user in context
		getSettingsHandler(c)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("UpsertSettings - Bad Request", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest(http.MethodPut, "/settings", bytes.NewBufferString("{bad"))
		req.Header.Set("Content-Type", "application/json")

		c, _ := gin.CreateTestContext(w)
		c.Request = req
		c.Set("user", testUser)

		upsertSettingsHandler(c)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}