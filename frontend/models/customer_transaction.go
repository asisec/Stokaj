package models

import "time"

type CustomerTransaction struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	CustomerID    uint      `json:"customer_id" gorm:"not null"`
	Type          string    `json:"type" gorm:"size:20;not null"` // "debt" (borç), "credit" (alacak)
	Amount        float64   `json:"amount" gorm:"type:decimal(12,2);not null"`
	Description   string    `json:"description" gorm:"size:255"`
	ReferenceType string    `json:"reference_type" gorm:"size:50"` // "sale", "payment"
	ReferenceID   uint      `json:"reference_id"` // ID of the sale or payment record
	CreatedAt     time.Time `json:"created_at"`
}
