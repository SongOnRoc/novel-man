package container

import (
	"go.uber.org/dig"
)

// Container is the global dependency injection container.
var Container = dig.New()
