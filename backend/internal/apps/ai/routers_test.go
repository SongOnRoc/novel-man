package ai

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	rg := r.Group("/ai")
	RegisterRoutes(rg)
	return r
}

func TestHandleCompletion(t *testing.T) {
	r := setupRouter()

	t.Run("Success", func(t *testing.T) {
		reqBody := CompletionRequest{
			Text: "这是一个开始",
		}
		jsonValue, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest(http.MethodPost, "/ai/completion", bytes.NewBuffer(jsonValue))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp CompletionResponse
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, "这是一个由AI生成的续写内容。", resp.Completion)
	})

	t.Run("Bad Request", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodPost, "/ai/completion", bytes.NewBuffer([]byte(`{"text":""}`)))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestHandlePolish(t *testing.T) {
	r := setupRouter()

	t.Run("Success", func(t *testing.T) {
		reqBody := PolishRequest{
			Text: "需要润色的文本",
		}
		jsonValue, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest(http.MethodPost, "/ai/polish", bytes.NewBuffer(jsonValue))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp PolishResponse
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, "这是由AI润色后的文本，它变得更加优美和流畅。", resp.PolishedText)
	})

	t.Run("Bad Request", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodPost, "/ai/polish", bytes.NewBuffer([]byte(`{"text":""}`)))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestHandleGenerateIdea(t *testing.T) {
	r := setupRouter()

	t.Run("Success", func(t *testing.T) {
		reqBody := GenerateIdeaRequest{
			Text: "给我一个点子",
		}
		jsonValue, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest(http.MethodPost, "/ai/generate/idea", bytes.NewBuffer(jsonValue))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp GenerateIdeaResponse
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, "这是一个由AI生成的绝妙点子：一个关于时间旅行的侦探故事。", resp.Idea)
	})

	t.Run("Bad Request", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodPost, "/ai/generate/idea", bytes.NewBuffer([]byte(`{"text":""}`)))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}