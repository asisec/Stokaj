package models

import "time"

type Motorcycle struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	ChassisNumber string    `json:"chassis_number" gorm:"uniqueIndex;size:50;not null"`
	Brand         string    `json:"brand" gorm:"size:100;not null"`
	Model         string    `json:"model" gorm:"size:100;not null"`
	Year          int       `json:"year" gorm:"not null"`
	Color         string    `json:"color" gorm:"size:50"`
	PurchasePrice float64   `json:"purchase_price" gorm:"type:decimal(12,2);not null"`
	SalePrice     float64   `json:"sale_price" gorm:"type:decimal(12,2);not null"`
	Status        string    `json:"status" gorm:"size:20;default:available;not null"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
