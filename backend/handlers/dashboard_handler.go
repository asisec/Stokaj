package handlers

import (
	"net/http"

	"stokaj-backend/database"
	"stokaj-backend/models"

	"github.com/gin-gonic/gin"
)

func GetDashboardStats(c *gin.Context) {
	var totalMotorcycles int64
	var availableMotorcycles int64
	var soldMotorcycles int64
	var totalSpareParts int64
	var totalSparePartsQuantity int64
	var lowStockParts int64
	var totalCustomers int64
	var totalSales int64
	var totalRevenue float64

	database.DB.Model(&models.Motorcycle{}).Count(&totalMotorcycles)
	database.DB.Model(&models.Motorcycle{}).Where("status = ?", "available").Count(&availableMotorcycles)
	database.DB.Model(&models.Motorcycle{}).Where("status = ?", "sold").Count(&soldMotorcycles)
	database.DB.Model(&models.SparePart{}).Count(&totalSpareParts)

	var quantityResult struct{ Total int64 }
	database.DB.Model(&models.SparePart{}).Select("COALESCE(SUM(quantity), 0) as total").Scan(&quantityResult)
	totalSparePartsQuantity = quantityResult.Total

	database.DB.Model(&models.SparePart{}).Where("quantity < ?", 5).Count(&lowStockParts)
	database.DB.Model(&models.Customer{}).Count(&totalCustomers)
	database.DB.Model(&models.Sale{}).Count(&totalSales)

	var revenueResult struct{ Total float64 }
	database.DB.Model(&models.Sale{}).Select("COALESCE(SUM(total_amount), 0) as total").Scan(&revenueResult)
	totalRevenue = revenueResult.Total

	var totalCostResult struct{ Total float64 }
	database.DB.Table("sale_items").Select("COALESCE(SUM(purchase_price * quantity), 0) as total").Scan(&totalCostResult)
	
	totalRevenue = revenueResult.Total - totalCostResult.Total

	var recentSales []models.Sale
	database.DB.Preload("Customer").Preload("Items").Preload("Payments").Order("created_at desc").Limit(5).Find(&recentSales)

	c.JSON(http.StatusOK, gin.H{
		"total_motorcycles":        totalMotorcycles,
		"available_motorcycles":    availableMotorcycles,
		"sold_motorcycles":         soldMotorcycles,
		"total_spare_parts":        totalSpareParts,
		"total_spare_parts_quantity": totalSparePartsQuantity,
		"low_stock_parts":          lowStockParts,
		"total_customers":          totalCustomers,
		"total_sales":              totalSales,
		"total_revenue":            totalRevenue,
		"recent_sales":             recentSales,
	})
}
