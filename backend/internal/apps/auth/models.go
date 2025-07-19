package auth

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User 定义了用户表的 GORM 模型
type User struct {
	ID           uint   `gorm:"primarykey"`
	Username     string `gorm:"type:varchar(255);unique;not null"`
	Email        string `gorm:"type:varchar(255);unique;not null"`
	PasswordHash string `gorm:"type:varchar(255);not null"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// TableName 指定 User 模型对应的数据库表名
func (User) TableName() string {
	return "users"
}

// HashPassword 使用 bcrypt 对密码进行哈希处理
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// CheckPasswordHash 验证密码哈希是否与给定的密码匹配
func (u *User) CheckPasswordHash(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

