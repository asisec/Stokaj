package utils

import (
	"errors"
	"strings"
)

var (
	ErrInvalidLength = errors.New("şasi numarası 17 haneli olmalıdır")
	ErrInvalidChar   = errors.New("şasi numarası geçersiz karakterler içeriyor")
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

	// We still calculate the check digit but we DO NOT return an error if it doesn't match.
	// This allows real-world European/Asian VINs that do not comply with the North American ISO 3779 checksum to be saved.
	return nil
}
