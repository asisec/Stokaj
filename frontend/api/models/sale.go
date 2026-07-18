package models

import "time"

type Sale struct {
	ID          uint          `json:"id" gorm:"primaryKey"`
	CustomerID  uint          `json:"customer_id" gorm:"not null"`
	Customer    Customer      `json:"customer" gorm:"foreignKey:CustomerID"`
	TotalAmount float64       `json:"total_amount" gorm:"type:decimal(12,2);not null"`
	Payments    []SalePayment `json:"payments" gorm:"foreignKey:SaleID"`
	Items       []SaleItem    `json:"items" gorm:"foreignKey:SaleID"`
	CreatedAt   time.Time     `json:"created_at"`
}

type SalePayment struct {
	ID     uint    `json:"id" gorm:"primaryKey"`
	SaleID uint    `json:"sale_id" gorm:"not null"`
	Method string  `json:"method" gorm:"size:50;not null"`
	Amount float64 `json:"amount" gorm:"type:decimal(12,2);not null"`
}

type SaleItem struct {
	ID         uint    `json:"id" gorm:"primaryKey"`
	SaleID     uint    `json:"sale_id" gorm:"not null"`
	ItemType   string  `json:"item_type" gorm:"size:20;not null"`
	ItemID     uint    `json:"item_id" gorm:"not null"`
	ItemName   string  `json:"item_name" gorm:"size:200;not null"`
	Quantity      int     `json:"quantity" gorm:"not null"`
	UnitPrice     float64 `json:"unit_price" gorm:"type:decimal(12,2);not null"`
	PurchasePrice float64 `json:"purchase_price" gorm:"type:decimal(12,2);default:0"`
	TotalPrice    float64 `json:"total_price" gorm:"type:decimal(12,2);not null"`
}
