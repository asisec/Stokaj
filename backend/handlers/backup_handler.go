package handlers

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"net/smtp"
	"net/textproto"
	"os"
	"os/exec"
	"strings"
	"time"

	"stokaj-backend/config"
	"stokaj-backend/database"
	"stokaj-backend/models"

	"github.com/gin-gonic/gin"
)

func loadSettings() (models.SmtpSetting, error) {
	var s models.SmtpSetting
	err := database.DB.First(&s).Error
	return s, err
}

func saveSettings(s models.SmtpSetting) error {
	var existing models.SmtpSetting
	err := database.DB.First(&existing).Error
	if err != nil {
		return database.DB.Create(&s).Error
	}
	s.ID = existing.ID
	return database.DB.Save(&s).Error
}

func GetSettings(c *gin.Context) {
	s, err := loadSettings()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"is_configured": false})
		return
	}
	isConfigured := s.Host != "" && s.RecipientEmail != ""
	c.JSON(http.StatusOK, gin.H{
		"is_configured": isConfigured,
	})
}

func SaveSettings(c *gin.Context) {
	var incoming models.SmtpSetting
	if err := c.ShouldBindJSON(&incoming); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz veri formatı"})
		return
	}

	if incoming.Password == "" {
		existing, err := loadSettings()
		if err == nil {
			incoming.Password = existing.Password
		}
	}

	if err := saveSettings(incoming); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ayarlar kaydedilemedi"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Ayarlar başarıyla kaydedildi"})
}

func TakeBackupAndEmail(cfg config.Config) {
	settings, err := loadSettings()
	if err != nil {
		log.Printf("TakeBackupAndEmail Error: Failed to load SMTP settings: %v\n", err)
		return
	}
	if settings.RecipientEmail == "" || settings.Host == "" {
		log.Printf("TakeBackupAndEmail Warning: SMTP settings are empty. Skipping backup email.\n")
		return
	}

	dump, err := runPgDump(cfg)
	if err != nil {
		log.Printf("TakeBackupAndEmail Error: pg_dump failed: %v. Output: %s\n", err, string(dump))
		return
	}

	if err := sendBackupEmail(settings, dump); err != nil {
		log.Printf("TakeBackupAndEmail Error: sendBackupEmail failed: %v\n", err)
	} else {
		log.Printf("TakeBackupAndEmail Success: Backup email sent to %s\n", settings.RecipientEmail)
	}
}

func runPgDump(cfg config.Config) ([]byte, error) {
	env := append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", cfg.DBPassword))
	cmd := exec.Command(
		"pg_dump",
		"-h", cfg.DBHost,
		"-p", cfg.DBPort,
		"-U", cfg.DBUser,
		"-d", cfg.DBName,
		"--clean",
		"--if-exists",
	)
	cmd.Env = env
	return cmd.Output()
}

func sendBackupEmail(s models.SmtpSetting, dump []byte) error {
	now := time.Now().Format("2006-01-02_15-04")
	filename := fmt.Sprintf("stokaj_backup_%s.sql", now)
	subject := fmt.Sprintf("Stokaj Yedeği - %s", time.Now().Format("02.01.2006 15:04"))

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	headers := make(textproto.MIMEHeader)
	headers.Set("Content-Type", "text/plain; charset=utf-8")
	part, err := writer.CreatePart(headers)
	if err != nil {
		return err
	}
	fmt.Fprintf(part, "Satış işlemi gerçekleşti. Veritabanı yedeği ekte yer almaktadır.\nTarih: %s", time.Now().Format("02.01.2006 15:04:05"))

	attachHeaders := make(textproto.MIMEHeader)
	attachHeaders.Set("Content-Type", "application/octet-stream")
	attachHeaders.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	attachPart, err := writer.CreatePart(attachHeaders)
	if err != nil {
		return err
	}
	if _, err = attachPart.Write(dump); err != nil {
		return err
	}
	writer.Close()

	header := strings.Join([]string{
		fmt.Sprintf("From: %s", s.Username),
		fmt.Sprintf("To: %s", s.RecipientEmail),
		fmt.Sprintf("Subject: %s", subject),
		"MIME-Version: 1.0",
		fmt.Sprintf("Content-Type: multipart/mixed; boundary=%s", writer.Boundary()),
		"",
	}, "\r\n")

	msg := []byte(header + "\r\n" + buf.String())

	addr := fmt.Sprintf("%s:%s", s.Host, s.Port)
	auth := smtp.PlainAuth("", s.Username, s.Password, s.Host)
	return smtp.SendMail(addr, auth, s.Username, []string{s.RecipientEmail}, msg)
}

func RestoreDatabase(c *gin.Context) {
	cfg := config.Load()

	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dosya yüklenemedi"})
		return
	}
	defer file.Close()

	content, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Dosya okunamadı"})
		return
	}

	tmpFile, err := os.CreateTemp("", "restore-*.sql")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Geçici dosya oluşturulamadı"})
		return
	}
	defer os.Remove(tmpFile.Name())

	if _, err = tmpFile.Write(content); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Dosya yazılamadı"})
		return
	}
	tmpFile.Close()

	env := append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", cfg.DBPassword))
	cmd := exec.Command(
		"psql",
		"-h", cfg.DBHost,
		"-p", cfg.DBPort,
		"-U", cfg.DBUser,
		"-d", cfg.DBName,
		"-f", tmpFile.Name(),
	)
	cmd.Env = env

	out, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Geri yükleme başarısız: %s", string(out)),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Veritabanı başarıyla geri yüklendi"})
}
