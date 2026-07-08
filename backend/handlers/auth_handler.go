package handlers

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kullanıcı adı ve şifre zorunludur"})
		return
	}

	// Check username
	if req.Username != "admin" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Hatalı kullanıcı adı veya şifre"})
		return
	}

	// Compare password with bcrypt hash from env
	passwordHash := os.Getenv("ADMIN_PASSWORD_HASH")
	if passwordHash == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Sunucu yapılandırma hatası: ADMIN_PASSWORD_HASH eksik"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Hatalı kullanıcı adı veya şifre"})
		return
	}

	// Generate JWT token
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Sunucu yapılandırma hatası: JWT_SECRET eksik"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "admin",
		"iss": "stokaj",
	})

	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token oluşturulamadı"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": tokenString})
}
