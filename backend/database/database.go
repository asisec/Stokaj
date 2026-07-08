package database

import (
	"fmt"

	"stokaj-backend/config"
	"stokaj-backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(cfg config.Config) error {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort, cfg.DBSSLMode,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("Veritabanına bağlanılamadı: %v", err)
	}

	err = DB.AutoMigrate(
		&models.Motorcycle{},
		&models.SparePart{},
		&models.Customer{},
		&models.Sale{},
		&models.SalePayment{},
		&models.SaleItem{},
	)
	if err != nil {
		return fmt.Errorf("Veritabanı tabloları oluşturulamadı: %v", err)
	}

	return nil
}
