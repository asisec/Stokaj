package handlers

import (
	"net/http"
	"regexp"

	"stokaj-backend/database"
	"stokaj-backend/models"

	"github.com/gin-gonic/gin"
)

func GetCustomers(c *gin.Context) {
	var customers []models.Customer
	query := database.DB

	if search := c.Query("search"); search != "" {
		like := "%" + search + "%"
		query = query.Where("first_name ILIKE ? OR last_name ILIKE ? OR phone ILIKE ?", like, like, like)
	}

	if err := query.Find(&customers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Müşteriler getirilirken bir hata oluştu"})
		return
	}

	c.JSON(http.StatusOK, customers)
}

func GetCustomer(c *gin.Context) {
	var customer models.Customer
	if err := database.DB.Preload("Sales.Items").Preload("Sales").First(&customer, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Müşteri bulunamadı"})
		return
	}
	c.JSON(http.StatusOK, customer)
}

func CreateCustomer(c *gin.Context) {
	var customer models.Customer
	if err := c.ShouldBindJSON(&customer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı"})
		return
	}

	match, _ := regexp.MatchString(`^[1-9]\d{10}$`, customer.IdentityNumber)
	if !match {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz T.C. Kimlik Numarası"})
		return
	}

	if err := database.DB.Create(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Müşteri kaydedilirken bir hata oluştu"})
		return
	}

	c.JSON(http.StatusCreated, customer)
}

func UpdateCustomer(c *gin.Context) {
	var customer models.Customer
	if err := database.DB.First(&customer, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Müşteri bulunamadı"})
		return
	}

	if err := c.ShouldBindJSON(&customer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı"})
		return
	}

	match, _ := regexp.MatchString(`^[1-9]\d{10}$`, customer.IdentityNumber)
	if !match {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz T.C. Kimlik Numarası"})
		return
	}

	if err := database.DB.Save(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Müşteri güncellenirken bir hata oluştu"})
		return
	}

	c.JSON(http.StatusOK, customer)
}

func DeleteCustomer(c *gin.Context) {
	var customer models.Customer
	if err := database.DB.First(&customer, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Müşteri bulunamadı"})
		return
	}

	if err := database.DB.Delete(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Müşteri silinirken bir hata oluştu"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Müşteri başarıyla silindi"})
}

type AddPaymentRequest struct {
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Method      string  `json:"method" binding:"required"`
	Description string  `json:"description"`
}

func AddCustomerPayment(c *gin.Context) {
	var req AddPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz ödeme bilgileri"})
		return
	}

	var customer models.Customer
	if err := database.DB.First(&customer, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Müşteri bulunamadı"})
		return
	}

	tx := database.DB.Begin()

	// Müşteri bakiyesinden düş (borç azalıyor)
	customer.Balance -= req.Amount
	if err := tx.Save(&customer).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Bakiye güncellenemedi"})
		return
	}

	// Tahsilat (credit/alacak) işlemini kaydet
	desc := req.Description
	if desc == "" {
		desc = "Tahsilat - " + req.Method
	}

	transaction := models.CustomerTransaction{
		CustomerID:    customer.ID,
		Type:          "credit",
		Amount:        req.Amount,
		Description:   desc,
		ReferenceType: "payment",
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "İşlem kaydedilemedi"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Tahsilat başarıyla kaydedildi", "balance": customer.Balance})
}

func GetCustomerTransactions(c *gin.Context) {
	var transactions []models.CustomerTransaction
	if err := database.DB.Where("customer_id = ?", c.Param("id")).Order("created_at desc").Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Hesap hareketleri getirilirken hata oluştu"})
		return
	}
	c.JSON(http.StatusOK, transactions)
}
