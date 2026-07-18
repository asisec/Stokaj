package handlers

import (
	"net/http"

	"stokaj-backend/database"
	"stokaj-backend/models"

	"github.com/gin-gonic/gin"
)

func GetSpareParts(c *gin.Context) {
	var parts []models.SparePart
	query := database.DB

	if search := c.Query("search"); search != "" {
		like := "%" + search + "%"
		query = query.Where("name ILIKE ? OR description ILIKE ? OR category ILIKE ? OR compatible_brand ILIKE ? OR compatible_model ILIKE ?", like, like, like, like, like)
	}

	if err := query.Find(&parts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Yedek parçalar getirilirken bir hata oluştu"})
		return
	}

	c.JSON(http.StatusOK, parts)
}

func GetSparePart(c *gin.Context) {
	var part models.SparePart
	if err := database.DB.First(&part, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Yedek parça bulunamadı"})
		return
	}
	c.JSON(http.StatusOK, part)
}

func CreateSparePart(c *gin.Context) {
	var part models.SparePart
	if err := c.ShouldBindJSON(&part); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı"})
		return
	}

	if err := database.DB.Create(&part).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Yedek parça kaydedilirken bir hata oluştu"})
		return
	}

	c.JSON(http.StatusCreated, part)
}

func CreateBulkSpareParts(c *gin.Context) {
	var parts []models.SparePart
	if err := c.ShouldBindJSON(&parts); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı"})
		return
	}

	if len(parts) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Eklenecek parça bulunamadı"})
		return
	}

	if err := database.DB.Create(&parts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Yedek parçalar kaydedilirken bir hata oluştu"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Toplu ekleme başarılı", "count": len(parts)})
}

func UpdateSparePart(c *gin.Context) {
	var part models.SparePart
	if err := database.DB.First(&part, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Yedek parça bulunamadı"})
		return
	}

	if err := c.ShouldBindJSON(&part); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı"})
		return
	}

	if err := database.DB.Save(&part).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Yedek parça güncellenirken bir hata oluştu"})
		return
	}

	c.JSON(http.StatusOK, part)
}

func DeleteSparePart(c *gin.Context) {
	var part models.SparePart
	if err := database.DB.First(&part, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Yedek parça bulunamadı"})
		return
	}

	if err := database.DB.Delete(&part).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Yedek parça silinirken bir hata oluştu"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Yedek parça başarıyla silindi"})
}
