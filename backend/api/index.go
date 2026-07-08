package api

import (
	"net/http"
	"stokaj-backend/config"
	"stokaj-backend/database"
	"stokaj-backend/handlers"
	"stokaj-backend/middleware"

	"github.com/gin-gonic/gin"
)

var app *gin.Engine

func init() {
	cfg := config.Load()
	database.Connect(cfg)

	app = gin.Default()
	app.Use(middleware.SetupCORS())

	// Note: When deployed on Vercel with rewrites "/api/backend(/.*)?",
	// the incoming request path might be stripped or not.
	// Typically, Vercel preserves the rewritten path if it's a proxy.
	// But actually the Vercel Go runtime will see the original path "/api/backend/api/motorcycles"
	// OR "/api/motorcycles" depending on rewrite.
	// Let's mount both just in case, or just mount `/api` because the rewrite sends it to the service.
	
	apiGroup := app.Group("/api")

	apiGroup.GET("/motorcycles", handlers.GetMotorcycles)
	apiGroup.GET("/motorcycles/:id", handlers.GetMotorcycle)
	apiGroup.POST("/motorcycles", handlers.CreateMotorcycle)
	apiGroup.PUT("/motorcycles/:id", handlers.UpdateMotorcycle)
	apiGroup.DELETE("/motorcycles/:id", handlers.DeleteMotorcycle)

	apiGroup.GET("/spare-parts", handlers.GetSpareParts)
	apiGroup.GET("/spare-parts/:id", handlers.GetSparePart)
	apiGroup.POST("/spare-parts", handlers.CreateSparePart)
	apiGroup.PUT("/spare-parts/:id", handlers.UpdateSparePart)
	apiGroup.DELETE("/spare-parts/:id", handlers.DeleteSparePart)

	apiGroup.GET("/customers", handlers.GetCustomers)
	apiGroup.GET("/customers/:id", handlers.GetCustomer)
	apiGroup.POST("/customers", handlers.CreateCustomer)
	apiGroup.PUT("/customers/:id", handlers.UpdateCustomer)
	apiGroup.DELETE("/customers/:id", handlers.DeleteCustomer)

	apiGroup.GET("/sales", handlers.GetSales)
	apiGroup.GET("/sales/:id", handlers.GetSale)
	apiGroup.POST("/sales", handlers.CreateSale)
	apiGroup.DELETE("/sales/:id", handlers.DeleteSale)

	apiGroup.GET("/dashboard/stats", handlers.GetDashboardStats)
}

// Handler is the entrypoint for Vercel Serverless
func Handler(w http.ResponseWriter, r *http.Request) {
	app.ServeHTTP(w, r)
}
