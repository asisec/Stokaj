package handlers

import (
	"fmt"
	"net/http"


	"stokaj-backend/database"
	"stokaj-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreatePaymentRequest struct {
	Method string  `json:"method" binding:"required"`
	Amount float64 `json:"amount" binding:"required"`
}

type CreateSaleRequest struct {
	CustomerID uint                   `json:"customer_id" binding:"required"`
	Payments   []CreatePaymentRequest `json:"payments" binding:"required,min=1"`
	Items      []CreateSaleItemRequest `json:"items" binding:"required,min=1"`
}

type CreateSaleItemRequest struct {
	ItemType  string  `json:"item_type" binding:"required"`
	ItemID    uint    `json:"item_id" binding:"required"`
	Quantity  int     `json:"quantity" binding:"required,min=1"`
	UnitPrice float64 `json:"unit_price" binding:"required"`
}

func GetSales(c *gin.Context) {
	var sales []models.Sale
	if err := database.DB.Preload("Customer").Preload("Items").Preload("Payments").Order("created_at desc").Find(&sales).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Satışlar getirilirken bir hata oluştu"})
		return
	}
	c.JSON(http.StatusOK, sales)
}

func GetSale(c *gin.Context) {
	var sale models.Sale
	if err := database.DB.Preload("Customer").Preload("Items").Preload("Payments").First(&sale, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Satış kaydı bulunamadı"})
		return
	}
	c.JSON(http.StatusOK, sale)
}

func CreateSale(c *gin.Context) {
	var req CreateSaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı"})
		return
	}

	var customer models.Customer
	if err := database.DB.First(&customer, req.CustomerID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Müşteri bulunamadı"})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var saleItems []models.SaleItem
		var totalAmount float64

		for _, item := range req.Items {
			switch item.ItemType {
			case "motorcycle":
				var motorcycle models.Motorcycle
				if err := tx.First(&motorcycle, item.ItemID).Error; err != nil {
					return fmt.Errorf("Motosiklet bulunamadı")
				}
				if motorcycle.Status != "available" {
					return fmt.Errorf("Bu motosiklet zaten satılmış")
				}

				itemTotal := item.UnitPrice * float64(item.Quantity)
				saleItems = append(saleItems, models.SaleItem{
					ItemType:      "motorcycle",
					ItemID:        item.ItemID,
					ItemName:      motorcycle.Brand + " " + motorcycle.Model,
					Quantity:      item.Quantity,
					UnitPrice:     item.UnitPrice,
					PurchasePrice: motorcycle.PurchasePrice,
					TotalPrice:    itemTotal,
				})
				totalAmount += itemTotal

				motorcycle.Status = "sold"
				motorcycle.SalePrice = item.UnitPrice
				if err := tx.Save(&motorcycle).Error; err != nil {
					return err
				}

			case "spare_part":
				return fmt.Errorf("Yedek parça satışı desteklenmemektedir")

			default:
				return fmt.Errorf("Geçersiz ürün tipi")
			}
		}

		var payments []models.SalePayment
		var paidTotal float64
		for _, p := range req.Payments {
			payments = append(payments, models.SalePayment{
				Method: p.Method,
				Amount: p.Amount,
			})
			paidTotal += p.Amount
		}

		if paidTotal < totalAmount {
			return fmt.Errorf("Ödeme tutarı toplam tutardan az olamaz")
		}

		sale := models.Sale{
			CustomerID:  req.CustomerID,
			TotalAmount: totalAmount,
			Payments:    payments,
			Items:       saleItems,
		}

		if err := tx.Create(&sale).Error; err != nil {
			return err
		}

		tx.Preload("Customer").Preload("Items").Preload("Payments").First(&sale, sale.ID)
		c.JSON(http.StatusCreated, sale)



		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}
}

func DeleteSale(c *gin.Context) {
	var sale models.Sale
	if err := database.DB.Preload("Items").Preload("Payments").First(&sale, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Satış bulunamadı"})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		// Revert motorcycles status back to available
		for _, item := range sale.Items {
			if item.ItemType == "motorcycle" {
				var motorcycle models.Motorcycle
				if err := tx.First(&motorcycle, item.ItemID).Error; err == nil {
					motorcycle.Status = "available"
					tx.Save(&motorcycle)
				}
			}
			// (If we had spare parts deducting stock, we would add them back here)
		}

		if err := tx.Where("sale_id = ?", sale.ID).Delete(&models.SaleItem{}).Error; err != nil {
			return err
		}
		if err := tx.Where("sale_id = ?", sale.ID).Delete(&models.SalePayment{}).Error; err != nil {
			return err
		}
		if err := tx.Delete(&sale).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Satış silinirken bir hata oluştu"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Satış başarıyla silindi"})
}
