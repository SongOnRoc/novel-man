package middlewares

import (
	"net/http"
	"strconv"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

type WorkFinder interface {
	FindWorkForUser(workID uint, userID uint) (interface{}, error)
}


// AuthRequired 是一个中间件，用于验证用户是否已登录
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		userID := session.Get("userID")

		if userID == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		// 将 userID 存入 context，以便后续处理函数使用
		c.Set("userID", userID)
		c.Next()
	}
}

// WorkOwnerMiddleware ensures the user owns the work.
func WorkOwnerMiddleware(finder WorkFinder) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		workIDStr := c.Param("work_id")
		workID, err := strconv.ParseUint(workIDStr, 10, 64)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid work ID"})
			return
		}

		work, err := finder.FindWorkForUser(uint(workID), userID.(uint))
		if err != nil {
			// Assuming gorm.ErrRecordNotFound is handled by the service and returns a specific error
			// For now, we'll check for a generic error.
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Work not found or you don't have permission"})
			return
		}

		c.Set("work", work)
		c.Next()
	}
}
