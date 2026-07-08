package utils

import (
	"errors"
	"strings"
)

var (
	ErrInvalidLength = errors.New("şasi numarası en fazla 17 haneli olmalıdır")
	ErrInvalidChar   = errors.New("şasi numarasında I, O ve Q harfleri bulunamaz")
)

func ValidateVIN(vin string) error {
	vin = strings.ReplaceAll(vin, "i", "I")
	vin = strings.ReplaceAll(vin, "ı", "I")
	
	cleaned := strings.ToUpper(strings.TrimSpace(vin))
	runes := []rune(cleaned)

	if len(runes) > 17 {
		return ErrInvalidLength
	}

	if strings.ContainsAny(cleaned, "IOQ") {
		return ErrInvalidChar
	}

	return nil
}
