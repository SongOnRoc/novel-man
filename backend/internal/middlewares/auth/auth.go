package auth

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"novel-man/backend/internal/container"
	"novel-man/backend/internal/contracts/auth"
	"novel-man/backend/internal/contracts/middlewares"
	"novel-man/backend/utils/context"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/dig"
)

const (
	// AuthMiddlewareName 是认证中间件在注册表中的名称。
	AuthMiddlewareName = "auth"
	// defaultJWTSecret 是在没有配置时的备用JWT密钥，仅用于开发环境。
	defaultJWTSecret = "your-super-secret-key-for-dev-env"
)

// 确保 AuthMiddleware 实现了 Middleware 接口。
var _ middlewares.Middleware = (*AuthMiddleware)(nil)

// JWTCustomClaims 定义了JWT的自定义声明。
type JWTCustomClaims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

// AuthMiddleware 实现了认证中间件。
type AuthMiddleware struct {
	authService auth.AuthService
	jwtSecret   []byte
}

// NewAuthMiddleware 创建一个新的认证中间件实例。
func NewAuthMiddleware(authService auth.AuthService) *AuthMiddleware {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = defaultJWTSecret
	}

	return &AuthMiddleware{
		authService: authService,
		jwtSecret:   []byte(secret),
	}
}

// Name 返回中间件的名称。
func (m *AuthMiddleware) Name() string {
	return AuthMiddlewareName
}

// Handler 返回认证中间件的核心处理函数。
func (m *AuthMiddleware) Handler() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := m.extractToken(c)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		claims, err := m.parseAndValidateToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		// 验证用户是否存在于系统中。
		if _, err := m.authService.GetCurrentUser(*context.New(c), claims.UserID); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User not found or inactive"})
			return
		}

		// 将用户ID安全地存入上下文。
		c.Set("userID", claims.UserID)
		c.Next()
	}
}

// extractToken 从 Authorization 头中提取 Bearer Token。
func (m *AuthMiddleware) extractToken(c *gin.Context) (string, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return "", errors.New("authorization header is required")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", errors.New("authorization header format must be Bearer {token}")
	}

	return parts[1], nil
}

// parseAndValidateToken 解析并验证JWT字符串。
func (m *AuthMiddleware) parseAndValidateToken(tokenString string) (*JWTCustomClaims, error) {
	claims := &JWTCustomClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return m.jwtSecret, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, errors.New("token has expired")
		}
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	if !token.Valid {
		return nil, errors.New("token is invalid")
	}

	return claims, nil
}

// AuthMiddlewareInitializer 实现了 MiddlewareInitializer 接口。
type AuthMiddlewareInitializer struct {
	AuthService auth.AuthService
}

// NewAuthMiddlewareInitializer 创建一个新的 AuthMiddlewareInitializer。
func NewAuthMiddlewareInitializer(authService auth.AuthService) middlewares.MiddlewareInitializer {
	return &AuthMiddlewareInitializer{AuthService: authService}
}

// Init 创建并返回一个 AuthMiddleware 实例。
func (i *AuthMiddlewareInitializer) Init() (middlewares.Middleware, error) {
	return NewAuthMiddleware(i.AuthService), nil
}

func init() {
	container.Container.Provide(NewAuthMiddlewareInitializer, dig.As(new(middlewares.MiddlewareInitializer)), dig.Group("middleware_initializers"))
}
