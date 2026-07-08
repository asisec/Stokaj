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
var dbInitialized bool

func init() {
	app = gin.Default()
	app.Use(middleware.SetupCORS())

	// Add middleware to check DB connection lazily
	app.Use(func(c *gin.Context) {
		if !dbInitialized {
			cfg := config.Load()
			err := database.Connect(cfg)
			if err != nil {
				c.AbortWithStatusJSON(500, gin.H{"error": "DB Hatası: " + err.Error()})
				return
			}
			dbInitialized = true
		}
		c.Next()
	})


	// Note: When deployed on Vercel with rewrites "/api/backend(/.*)?",
	// the incoming request path might be stripped or not.
	// Typically, Vercel preserves the rewritten path if it's a proxy.
	// But actually the Vercel Go runtime will see the original path "/api/backend/api/motorcycles"
	// OR "/api/motorcycles" depending on rewrite.
	// Let's mount both just in case, or just mount `/api` because the rewrite sends it to the service.
	
	apiGroup := app.Group("/api")

	// Public: login endpoint
	apiGroup.POST("/login", handlers.Login)

	// Protected: all other routes require valid JWT
	protected := apiGroup.Group("/")
	protected.Use(middleware.RequireAuth())

	protected.GET("/motorcycles", handlers.GetMotorcycles)
	protected.GET("/motorcycles/:id", handlers.GetMotorcycle)
	protected.POST("/motorcycles", handlers.CreateMotorcycle)
	protected.PUT("/motorcycles/:id", handlers.UpdateMotorcycle)
	protected.DELETE("/motorcycles/:id", handlers.DeleteMotorcycle)

	protected.GET("/spare-parts", handlers.GetSpareParts)
	protected.GET("/spare-parts/:id", handlers.GetSparePart)
	protected.POST("/spare-parts", handlers.CreateSparePart)
	protected.PUT("/spare-parts/:id", handlers.UpdateSparePart)
	protected.DELETE("/spare-parts/:id", handlers.DeleteSparePart)

	protected.GET("/customers", handlers.GetCustomers)
	protected.GET("/customers/:id", handlers.GetCustomer)
	protected.POST("/customers", handlers.CreateCustomer)
	protected.PUT("/customers/:id", handlers.UpdateCustomer)
	protected.DELETE("/customers/:id", handlers.DeleteCustomer)

	protected.GET("/sales", handlers.GetSales)
	protected.GET("/sales/:id", handlers.GetSale)
	protected.POST("/sales", handlers.CreateSale)
	protected.DELETE("/sales/:id", handlers.DeleteSale)

	protected.GET("/dashboard/stats", handlers.GetDashboardStats)
}

// Handler is the entrypoint for Vercel Serverless
func Handler(w http.ResponseWriter, r *http.Request) {
	app.ServeHTTP(w, r)
}
