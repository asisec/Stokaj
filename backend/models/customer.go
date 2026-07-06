package models

import "time"

type Customer struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	FirstName      string    `json:"first_name" gorm:"size:100;not null"`
	LastName       string    `json:"last_name" gorm:"size:100;not null"`
	IdentityNumber string    `json:"identity_number" gorm:"size:11;not null"`
	Phone          string    `json:"phone" gorm:"size:20"`
	Email     string    `json:"email" gorm:"size:100"`
	Address   string    `json:"address" gorm:"type:text"`
	Balance   float64   `json:"balance" gorm:"type:decimal(12,2);default:0"`
	Sales     []Sale    `json:"sales,omitempty" gorm:"foreignKey:CustomerID"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
