package apps

import "github.com/gin-gonic/gin"

// Module is the interface that all application modules must implement.
type Module interface {
	RegisterRoutes(router *gin.RouterGroup)
}

var registeredModules []Module

// Register is called by each module's init() function to register itself.
func Register(mod Module) {
	registeredModules = append(registeredModules, mod)
}

// GetRegisteredModules returns all registered modules.
func GetRegisteredModules() []Module {
	return registeredModules
}
