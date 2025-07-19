package auth

import (
	"net/http"
	"os"
	"time"

	"novel-man/backend/internal/logger"
	"novel-man/backend/utils/context"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// JWTCustomClaims 定义了JWT的自定义声明
type JWTCustomClaims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

var jwtSecret = []byte(os.Getenv("JWT_SECRET")) // 强烈建议从环境变量获取密钥

// generateJWT 生成一个新的JWT
func generateJWT(userID uint) (string, error) {
	claims := JWTCustomClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 72)), // 令牌有效期72小时
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "novel-man-api",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// RegisterPublicRoutes 注册公共认证路由 (无需认证)
func RegisterPublicRoutes(r *gin.RouterGroup, gormDB *gorm.DB) {
	r.POST("/register", registerHandler(gormDB))
	r.POST("/login", loginHandler(gormDB))
	r.POST("/logout", logoutHandler) // 登出通常是客户端行为，但保留端点以符合规范
}

// RegisterPrivateRoutes 注册私有认证路由 (需要认证)
func RegisterPrivateRoutes(r *gin.RouterGroup, gormDB *gorm.DB) {
	r.GET("/me", meHandler(gormDB))
}

// registerHandler 处理用户注册
func registerHandler(gormDB *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.New(c.Request.Context())
		logger.Info(ctx, "Attempting to register a new user")

		var req struct {
			Username string `json:"username" binding:"required,min=4,max=32"`
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required,min=8"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			logger.Warn(ctx, "Failed to bind JSON for user registration: {}", err.Error())
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		logger.Debug(ctx, "Registration request for user: {}", req.Username)

		// 检查用户名或邮箱是否已存在
		var existingUser User
		if err := gormDB.Where("username = ? OR email = ?", req.Username, req.Email).First(&existingUser).Error; err == nil {
			logger.Warn(ctx, "Registration failed: username '{}' or email '{}' already exists", req.Username, req.Email)
			c.JSON(http.StatusConflict, gin.H{"error": "Username or email already exists"})
			return
		}

		// 显式地哈希密码
		hashedPassword, err := HashPassword(req.Password)
		if err != nil {
			logger.Error(ctx, "Failed to hash password for user {}: {}", req.Username, err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}

		user := User{
			Username:     req.Username,
			Email:        req.Email,
			PasswordHash: hashedPassword,
		}

		if err := gormDB.Create(&user).Error; err != nil {
			logger.Error(ctx, "Failed to create user '{}' in database: {}", req.Username, err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		logger.Info(ctx, "User '{}' (ID: {}) registered successfully", user.Username, user.ID)

		// 遵循API规范，返回创建的用户信息
		c.JSON(http.StatusCreated, gin.H{
			"id":         user.ID,
			"username":   user.Username,
			"email":      user.Email,
			"created_at": user.CreatedAt,
		})
	}
}

// loginHandler 处理用户登录
func loginHandler(gormDB *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.New(c.Request.Context())
		logger.Info(ctx, "Attempting to log in a user")

		var req struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			logger.Warn(ctx, "Failed to bind JSON for user login: {}", err.Error())
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		logger.Debug(ctx, "Login request for email: {}", req.Email)

		var user User
		if err := gormDB.Where("email = ?", req.Email).First(&user).Error; err != nil {
			logger.Warn(ctx, "Login failed for email '{}': user not found", req.Email)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}

		if !user.CheckPasswordHash(req.Password) {
			logger.Warn(ctx, "Login failed for user '{}' (ID: {}): invalid password", user.Username, user.ID)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}

		// 生成JWT
		token, err := generateJWT(user.ID)
		if err != nil {
			logger.Error(ctx, "Failed to generate JWT for user '{}' (ID: {}): {}", user.Username, user.ID, err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		logger.Info(ctx, "User '{}' (ID: {}) logged in successfully", user.Username, user.ID)

		// 遵循API规范返回JWT
		c.JSON(http.StatusOK, gin.H{
			"access_token": token,
			"token_type":   "Bearer",
		})
	}
}

// logoutHandler 处理用户登出
// 在无状态的JWT认证中，登出主要是客户端的责任（删除token）。
// 服务端可以实现一个token黑名单来使其立即失效，但为简化，此处仅返回成功信息。
func logoutHandler(c *gin.Context) {
	ctx := context.New(c.Request.Context())
	// 尝试从上下文中获取userID，即使登出不需要认证，也可以记录是哪个用户登出
	userID, exists := c.Get("userID")
	if exists {
		logger.Info(ctx, "User (ID: {}) logged out", userID)
	} else {
		logger.Info(ctx, "A user logged out")
	}
	c.JSON(http.StatusOK, gin.H{"message": "Successfully logged out"})
}

// meHandler 获取当前用户信息
func meHandler(gormDB *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.New(c.Request.Context())
		logger.Info(ctx, "Attempting to get current user info")

		// userID 由JWT中间件注入
		userID, exists := c.Get("userID")
		if !exists {
			logger.Error(ctx, "Failed to get user info: userID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID not found in context"})
			return
		}

		uid, ok := userID.(uint)
		if !ok {
			logger.Error(ctx, "Failed to get user info: userID in context is not of type uint")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error: invalid user ID type in context"})
			return
		}

		logger.Debug(ctx, "Fetching info for user ID: {}", uid)

		var user User
		// 使用类型断言获取用户ID
		if err := gormDB.Select("id, username, email").First(&user, uid).Error; err != nil {
			logger.Error(ctx, "Failed to fetch user (ID: {}) from database: {}", uid, err.Error())
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		logger.Info(ctx, "Successfully fetched info for user '{}' (ID: {})", user.Username, user.ID)

		c.JSON(http.StatusOK, gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
		})
	}
}
