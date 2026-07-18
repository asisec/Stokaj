package handlers

import (
	"net/http"

	"stokaj-backend/database"
	"stokaj-backend/models"

	"github.com/gin-gonic/gin"
)

type SalesTrend struct {
	Month   string  `json:"month"`
	Revenue float64 `json:"revenue"`
}

type BrandStat struct {
	Brand string `json:"brand"`
	Count int64  `json:"count"`
}

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
	var totalReceivables float64

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

	var totalCostResult struct{ Total float64 }
	database.DB.Table("sale_items").Select("COALESCE(SUM(purchase_price * quantity), 0) as total").Scan(&totalCostResult)

	totalRevenue = revenueResult.Total - totalCostResult.Total

	var receivablesResult struct{ Total float64 }
	database.DB.Model(&models.Customer{}).Select("COALESCE(SUM(balance), 0) as total").Scan(&receivablesResult)
	totalReceivables = receivablesResult.Total

	var recentSales []models.Sale
	database.DB.Preload("Customer").Preload("Items").Preload("Payments").Order("created_at desc").Limit(5).Find(&recentSales)

	var salesTrend []SalesTrend
	database.DB.Raw(`
		SELECT to_char(created_at, 'YYYY-MM') as month, SUM(total_amount) as revenue 
		FROM sales 
		WHERE created_at >= NOW() - INTERVAL '6 months' 
		GROUP BY month 
		ORDER BY month
	`).Scan(&salesTrend)

	var topBrands []BrandStat
	database.DB.Raw(`
		SELECT m.brand, COUNT(si.id) as count 
		FROM sale_items si 
		JOIN motorcycles m ON si.item_id = m.id 
		WHERE si.item_type = 'motorcycle' 
		GROUP BY m.brand 
		ORDER BY count DESC 
		LIMIT 5
	`).Scan(&topBrands)

	var customersWithBalance []models.Customer
	database.DB.Where("balance > 0").Order("balance desc").Find(&customersWithBalance)

	c.JSON(http.StatusOK, gin.H{
		"total_motorcycles":          totalMotorcycles,
		"available_motorcycles":      availableMotorcycles,
		"sold_motorcycles":           soldMotorcycles,
		"total_spare_parts":          totalSpareParts,
		"total_spare_parts_quantity": totalSparePartsQuantity,
		"low_stock_parts":            lowStockParts,
		"total_customers":            totalCustomers,
		"total_sales":                totalSales,
		"total_revenue":              totalRevenue,
		"total_receivables":          totalReceivables,
		"recent_sales":               recentSales,
		"sales_trend":                salesTrend,
		"top_brands":                 topBrands,
		"customers_with_balance":     customersWithBalance,
	})
}
