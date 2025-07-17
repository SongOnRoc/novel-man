package auth

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
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

// BeforeSave GORM钩子，在创建用户时自动哈希密码
// 注意：这个钩子不会在更新时自动处理密码，需要在业务逻辑中显式调用HashPassword
func (u *User) BeforeSave(tx *gorm.DB) (err error) {
	// 仅在创建新记录时（ID为0）且密码字段不为空时执行
	if u.ID == 0 && u.PasswordHash != "" {
		hashedPassword, err := HashPassword(u.PasswordHash)
		if err != nil {
			return err
		}
		u.PasswordHash = hashedPassword
	}
	return
}
