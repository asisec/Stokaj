package api

import (
	"fmt"
	"net/http"

	"stokaj-backend/config"
	"stokaj-backend/database"
	"stokaj-backend/handlers"
	"stokaj-backend/middleware"

	"github.com/gin-gonic/gin"
)

var app *gin.Engine
var dbInitialized bool

func init() {
	cfg := config.Load()
	
	// Set Gin to release mode
	gin.SetMode(gin.ReleaseMode)
	app = gin.New()
	app.Use(gin.Recovery())
	app.Use(middleware.SetupCORS())

	// Initialize DB if not initialized. Since Vercel is serverless, 
	// we should try to reuse the connection.
	err := database.Connect(cfg)
	if err != nil {
		fmt.Println("DB Hatası:", err)
	} else {
		dbInitialized = true
	}

	app.Use(func(c *gin.Context) {
		if !dbInitialized {
			err := database.Connect(cfg)
			if err != nil {
				c.AbortWithStatusJSON(500, gin.H{"error": "DB Hatası: " + err.Error()})
				return
			}
			dbInitialized = true
		}
		c.Next()
	})

	// Vercel routes all requests to /api/backend to this handler
	apiGroup := app.Group("/api/backend")

	apiGroup.POST("/login", handlers.Login)

	apiGroup.GET("/motorcycles", handlers.GetMotorcycles)
	apiGroup.GET("/motorcycles/:id", handlers.GetMotorcycle)
	apiGroup.POST("/motorcycles", handlers.CreateMotorcycle)
	apiGroup.PUT("/motorcycles/:id", handlers.UpdateMotorcycle)
	apiGroup.DELETE("/motorcycles/:id", handlers.DeleteMotorcycle)

	apiGroup.GET("/spare-parts", handlers.GetSpareParts)
	apiGroup.GET("/spare-parts/:id", handlers.GetSparePart)
	apiGroup.POST("/spare-parts/bulk", handlers.CreateBulkSpareParts)
	apiGroup.POST("/spare-parts", handlers.CreateSparePart)
	apiGroup.PUT("/spare-parts/:id", handlers.UpdateSparePart)
	apiGroup.DELETE("/spare-parts/:id", handlers.DeleteSparePart)

	apiGroup.GET("/customers", handlers.GetCustomers)
	apiGroup.GET("/customers/:id", handlers.GetCustomer)
	apiGroup.POST("/customers", handlers.CreateCustomer)
	apiGroup.PUT("/customers/:id", handlers.UpdateCustomer)
	apiGroup.DELETE("/customers/:id", handlers.DeleteCustomer)
	apiGroup.POST("/customers/:id/payments", handlers.AddCustomerPayment)
	apiGroup.GET("/customers/:id/transactions", handlers.GetCustomerTransactions)

	apiGroup.GET("/sales", handlers.GetSales)
	apiGroup.GET("/sales/:id", handlers.GetSale)
	apiGroup.POST("/sales", handlers.CreateSale)
	apiGroup.DELETE("/sales/:id", handlers.DeleteSale)

	apiGroup.GET("/dashboard/stats", handlers.GetDashboardStats)
}

// Handler is the entrypoint for Vercel Serverless Function
func Handler(w http.ResponseWriter, r *http.Request) {
	app.ServeHTTP(w, r)
}
