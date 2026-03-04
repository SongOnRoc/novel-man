package config

import "os"

const (
	// DefaultJWTSecret is the default JWT secret key for development environments.
	DefaultJWTSecret = "your-super-secret-key-for-dev-env"
)

// GetJWTSecret retrieves the JWT secret from environment variables, falling back to the default.
func GetJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return DefaultJWTSecret
	}
	return secret
}
