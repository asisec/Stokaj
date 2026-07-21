package handler

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

	gin.SetMode(gin.ReleaseMode)
	app = gin.New()
	app.Use(gin.Recovery())
	app.Use(middleware.SetupCORS())

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

	api := app.Group("/api")

	api.POST("/login", handlers.Login)

	api.GET("/motorcycles", handlers.GetMotorcycles)
	api.GET("/motorcycles/:id", handlers.GetMotorcycle)
	api.POST("/motorcycles", handlers.CreateMotorcycle)
	api.PUT("/motorcycles/:id", handlers.UpdateMotorcycle)
	api.DELETE("/motorcycles/:id", handlers.DeleteMotorcycle)

	api.GET("/spare-parts", handlers.GetSpareParts)
	api.GET("/spare-parts/:id", handlers.GetSparePart)
	api.POST("/spare-parts/bulk", handlers.CreateBulkSpareParts)
	api.POST("/spare-parts", handlers.CreateSparePart)
	api.PUT("/spare-parts/:id", handlers.UpdateSparePart)
	api.DELETE("/spare-parts/:id", handlers.DeleteSparePart)

	api.GET("/customers", handlers.GetCustomers)
	api.GET("/customers/:id", handlers.GetCustomer)
	api.POST("/customers", handlers.CreateCustomer)
	api.PUT("/customers/:id", handlers.UpdateCustomer)
	api.DELETE("/customers/:id", handlers.DeleteCustomer)
	api.POST("/customers/:id/payments", handlers.AddCustomerPayment)
	api.GET("/customers/:id/transactions", handlers.GetCustomerTransactions)

	api.GET("/sales", handlers.GetSales)
	api.GET("/sales/:id", handlers.GetSale)
	api.POST("/sales", handlers.CreateSale)
	api.DELETE("/sales/:id", handlers.DeleteSale)

	api.GET("/dashboard/stats", handlers.GetDashboardStats)
}

// Handler is the Vercel Serverless Function entrypoint
func Handler(w http.ResponseWriter, r *http.Request) {
	app.ServeHTTP(w, r)
}
