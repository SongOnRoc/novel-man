package main

import "novel-man/backend/internal/cmd"

// @title           API 1.0
// @version         1.0
// @description     This is the API for Test.
// @servers         http://localhost:8080/api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	cmd.Execute()
}
