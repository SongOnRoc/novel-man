package chapters

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"novel-man/backend/internal/apps/auth"
	"novel-man/backend/internal/apps/works"
	"novel-man/backend/internal/middlewares"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// testAuthMiddleware creates a middleware to simulate an authenticated user.
func testAuthMiddleware(userID uint) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("userID", userID)
		c.Next()
	}
}

// setupTestRouter initializes a test router with an in-memory SQLite database.
func setupTestRouter() (*gin.Engine, *gorm.DB) {
	gin.SetMode(gin.TestMode)
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintf("failed to connect database: %v", err))
	}

	db.AutoMigrate(&works.Work{}, &Chapter{}, &auth.User{})

	router := gin.Default()
	router.Use(func(c *gin.Context) {
		c.Set("db", db)
		c.Next()
	})

	return router, db
}

func TestChapterRoutes(t *testing.T) {
	router, db := setupTestRouter()

	// --- Setup Data ---
	testUser := auth.User{Username: "testuser", Email: "test@example.com", PasswordHash: "password"}
	db.Create(&testUser)

	otherUser := auth.User{Username: "otheruser", Email: "other@example.com", PasswordHash: "password"}
	db.Create(&otherUser)

	testWork := works.Work{UserID: testUser.ID, Title: "Test Work", Status: "Draft"}
	db.Create(&testWork)

	// --- Register Routes with Auth Middleware ---
	workService := &works.WorkService{DB: db}
	authedGroup := router.Group("/works/:work_id")
	authedGroup.Use(testAuthMiddleware(testUser.ID)) // Simulate user 1 is logged in
	authedGroup.Use(middlewares.WorkOwnerMiddleware(workService))
	RegisterRoutes(authedGroup, db)

	// --- Test Cases ---
	var createdChapterID uint

	t.Run("Create Chapter - Success", func(t *testing.T) {
		input := gin.H{"title": "New Chapter", "content": "Some content here."}
		jsonBody, _ := json.Marshal(input)
		req, _ := http.NewRequest("POST", fmt.Sprintf("/works/%d/chapters", testWork.ID), bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		var chapter Chapter
		json.Unmarshal(w.Body.Bytes(), &chapter)
		assert.Equal(t, "New Chapter", chapter.Title)
		createdChapterID = chapter.ID
	})

	t.Run("Get Chapter - Success", func(t *testing.T) {
		req, _ := http.NewRequest("GET", fmt.Sprintf("/works/%d/chapters/%d", testWork.ID, createdChapterID), nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var chapter Chapter
		json.Unmarshal(w.Body.Bytes(), &chapter)
		assert.Equal(t, "New Chapter", chapter.Title)
	})

	t.Run("Update Chapter - Success", func(t *testing.T) {
		input := gin.H{"title": "Updated Chapter Title"}
		jsonBody, _ := json.Marshal(input)
		req, _ := http.NewRequest("PUT", fmt.Sprintf("/works/%d/chapters/%d", testWork.ID, createdChapterID), bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var chapter Chapter
		db.First(&chapter, createdChapterID)
		assert.Equal(t, "Updated Chapter Title", chapter.Title)
	})

	t.Run("Get Chapters - Success", func(t *testing.T) {
		req, _ := http.NewRequest("GET", fmt.Sprintf("/works/%d/chapters", testWork.ID), nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response gin.H
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Len(t, response["data"], 1)
	})

	t.Run("Delete Chapter - Success", func(t *testing.T) {
		req, _ := http.NewRequest("DELETE", fmt.Sprintf("/works/%d/chapters/%d", testWork.ID, createdChapterID), nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNoContent, w.Code)
		err := db.First(&Chapter{}, createdChapterID).Error
		assert.ErrorIs(t, err, gorm.ErrRecordNotFound)
	})

	// --- Test Permission Denied ---
	t.Run("Create Chapter - Permission Denied", func(t *testing.T) {
		// Create a new router instance for this specific test case to avoid middleware conflicts
		// but use the SAME database instance.
		permissionRouter := gin.Default()
		permissionRouter.Use(func(c *gin.Context) {
			c.Set("db", db)
			c.Next()
		})
		unauthedGroup := permissionRouter.Group("/works/:work_id")
		unauthedGroup.Use(testAuthMiddleware(otherUser.ID)) // Simulate user 2 is logged in
		unauthedGroup.Use(middlewares.WorkOwnerMiddleware(workService))
		RegisterRoutes(unauthedGroup, db)

		input := gin.H{"title": "Chapter by other user"}
		jsonBody, _ := json.Marshal(input)
		req, _ := http.NewRequest("POST", fmt.Sprintf("/works/%d/chapters", testWork.ID), bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		permissionRouter.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
		assert.JSONEq(t, `{"error":"Work not found or you don't have permission"}`, w.Body.String())
	})
}
