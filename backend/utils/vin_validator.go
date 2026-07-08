package utils

import (
	"errors"
	"strings"
)

var (
	ErrInvalidLength = errors.New("şasi numarası 17 haneli olmalıdır")
	ErrInvalidChar   = errors.New("şasi numarası geçersiz karakterler içeriyor")
	ErrCheckDigit    = errors.New("geçersiz şasi numarası")
)

var transliterationTable = map[rune]int{
	'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
	'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
	'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
	'1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '0': 0,
}

var weights = [17]int{8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2}

func ValidateVIN(vin string) error {
	cleaned := strings.ToUpper(strings.TrimSpace(vin))

	if len(cleaned) != 17 {
		return ErrInvalidLength
	}

	totalSum := 0
	for i, char := range cleaned {
		numericValue, exists := transliterationTable[char]
		if !exists {
			return ErrInvalidChar
		}
		totalSum += numericValue * weights[i]
	}

	remainder := totalSum % 11
	var expectedCheckDigit byte

	if remainder == 10 {
		expectedCheckDigit = 'X'
	} else {
		expectedCheckDigit = byte('0' + remainder)
	}

	if cleaned[8] != expectedCheckDigit {
		return ErrCheckDigit
	}

	return nil
}
