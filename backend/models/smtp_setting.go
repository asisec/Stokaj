package models

type SmtpSetting struct {
	ID             uint   `json:"id" gorm:"primaryKey"`
	Host           string `json:"smtp_host" gorm:"size:200"`
	Port           string `json:"smtp_port" gorm:"size:50"`
	Username       string `json:"smtp_username" gorm:"size:200"`
	Password       string `json:"smtp_password" gorm:"size:200"`
	RecipientEmail string `json:"recipient_email" gorm:"size:200"`
}
