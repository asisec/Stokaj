package models

import "time"

type SparePart struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	Category        string    `json:"category" gorm:"size:100"`
	Name            string    `json:"name" gorm:"size:200;not null"`
	CompatibleBrand string    `json:"compatible_brand" gorm:"size:100"`
	CompatibleModel string    `json:"compatible_model" gorm:"size:100"`
	Quantity        int       `json:"quantity" gorm:"default:0;not null"`
	Description     string    `json:"description" gorm:"type:text"`
	IsDefective     bool      `json:"is_defective" gorm:"default:false;not null"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
