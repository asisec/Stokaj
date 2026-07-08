export function validateVIN(vin: string): { isValid: boolean; message: string } {
  if (!vin || vin.trim() === "") {
    return { isValid: false, message: "" };
  }

  const cleanedVin = vin.trim().toUpperCase();

  if (cleanedVin.length !== 17) {
    return { isValid: false, message: "Şasi numarası tam olarak 17 karakter olmalıdır." };
  }

  const TransliterationTable: Record<string, number> = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '0': 0
  };

  const Weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

  let totalSum = 0;

  for (let i = 0; i < 17; i++) {
    const currentCharacter = cleanedVin[i];

    const numericValue = TransliterationTable[currentCharacter];
    if (numericValue === undefined) {
      return { isValid: false, message: "Şasi numarası geçersiz karakterler içeriyor." };
    }

    totalSum += numericValue * Weights[i];
  }

  const remainder = totalSum % 11;
  const expectedCheckDigit = remainder === 10 ? 'X' : remainder.toString()[0];

  if (cleanedVin[8] === expectedCheckDigit) {
    return { isValid: true, message: "Geçerli bir şasi numarası." };
  } else {
    return { isValid: false, message: "Geçersiz şasi numarası." };
  }
}
