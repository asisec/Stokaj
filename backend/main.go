package main

import (
	"stokaj-backend/config"
	"stokaj-backend/database"
	"stokaj-backend/handlers"
	"stokaj-backend/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	database.Connect(cfg)

	r := gin.Default()
	r.Use(middleware.SetupCORS())

	api := r.Group("/api")

	api.GET("/motorcycles", handlers.GetMotorcycles)
	api.GET("/motorcycles/:id", handlers.GetMotorcycle)
	api.POST("/motorcycles", handlers.CreateMotorcycle)
	api.PUT("/motorcycles/:id", handlers.UpdateMotorcycle)
	api.DELETE("/motorcycles/:id", handlers.DeleteMotorcycle)

	api.GET("/spare-parts", handlers.GetSpareParts)
	api.GET("/spare-parts/:id", handlers.GetSparePart)
	api.POST("/spare-parts", handlers.CreateSparePart)
	api.PUT("/spare-parts/:id", handlers.UpdateSparePart)
	api.DELETE("/spare-parts/:id", handlers.DeleteSparePart)

	api.GET("/customers", handlers.GetCustomers)
	api.GET("/customers/:id", handlers.GetCustomer)
	api.POST("/customers", handlers.CreateCustomer)
	api.PUT("/customers/:id", handlers.UpdateCustomer)
	api.DELETE("/customers/:id", handlers.DeleteCustomer)

	api.GET("/sales", handlers.GetSales)
	api.GET("/sales/:id", handlers.GetSale)
	api.POST("/sales", handlers.CreateSale)
	api.DELETE("/sales/:id", handlers.DeleteSale)

	api.GET("/dashboard/stats", handlers.GetDashboardStats)

	r.Run(":" + cfg.Port)
}
