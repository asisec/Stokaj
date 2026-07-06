package handlers

import (
	"net/http"

	"stokaj-backend/database"
	"stokaj-backend/models"

	"github.com/gin-gonic/gin"
)

func GetMotorcycles(c *gin.Context) {
	var motorcycles []models.Motorcycle
	query := database.DB

	if search := c.Query("search"); search != "" {
		like := "%" + search + "%"
		query = query.Where("brand ILIKE ? OR model ILIKE ? OR chassis_number ILIKE ?", like, like, like)
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&motorcycles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Motosikletler getirilirken bir hata oluştu"})
		return
	}

	c.JSON(http.StatusOK, motorcycles)
}

func GetMotorcycle(c *gin.Context) {
	var motorcycle models.Motorcycle
	if err := database.DB.First(&motorcycle, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Motosiklet bulunamadı"})
		return
	}
	c.JSON(http.StatusOK, motorcycle)
}

func CreateMotorcycle(c *gin.Context) {
	var motorcycle models.Motorcycle
	if err := c.ShouldBindJSON(&motorcycle); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı"})
		return
	}

	if err := database.DB.Create(&motorcycle).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Motosiklet kaydedilirken bir hata oluştu"})
		return
	}

	c.JSON(http.StatusCreated, motorcycle)
}

func UpdateMotorcycle(c *gin.Context) {
	var motorcycle models.Motorcycle
	if err := database.DB.First(&motorcycle, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Motosiklet bulunamadı"})
		return
	}

	if err := c.ShouldBindJSON(&motorcycle); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı"})
		return
	}

	if err := database.DB.Save(&motorcycle).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Motosiklet güncellenirken bir hata oluştu"})
		return
	}

	c.JSON(http.StatusOK, motorcycle)
}

func DeleteMotorcycle(c *gin.Context) {
	var motorcycle models.Motorcycle
	if err := database.DB.First(&motorcycle, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Motosiklet bulunamadı"})
		return
	}

	if err := database.DB.Delete(&motorcycle).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Motosiklet silinirken bir hata oluştu"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Motosiklet başarıyla silindi"})
}
