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
