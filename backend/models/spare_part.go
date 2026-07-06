package models

import "time"

type SparePart struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"size:200;not null"`
	Quantity    int       `json:"quantity" gorm:"default:0;not null"`
	Description string    `json:"description" gorm:"type:text"`
	IsDefective bool      `json:"is_defective" gorm:"default:false;not null"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
