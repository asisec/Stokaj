package database

import (
	"fmt"

	"stokaj-backend/config"
	"stokaj-backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(cfg config.Config) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort, cfg.DBSSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Veritabanına bağlanılamadı: " + err.Error())
	}

	db.AutoMigrate(
		&models.Motorcycle{},
		&models.SparePart{},
		&models.Customer{},
		&models.Sale{},
		&models.SalePayment{},
		&models.SaleItem{},
	)

	DB = db
}
