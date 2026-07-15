export type VinValidationResult = {
  status: 'valid' | 'partial' | 'invalid';
  message: string;
};

export function validateVIN(vin: string): VinValidationResult {
  if (!vin || vin.trim() === "") {
    return { status: 'invalid', message: "Şasi numarası boş bırakılamaz." };
  }

  let cleanedVin = vin.trim();
  cleanedVin = cleanedVin.replace(/i/g, "I").replace(/ı/g, "I");
  cleanedVin = cleanedVin.toUpperCase();

  if (cleanedVin.length > 17) {
    return { status: 'invalid', message: "Şasi numarası en fazla 17 karakter olmalıdır." };
  }

  if (/[OQ]/.test(cleanedVin) || cleanedVin.includes('I')) {
    return { status: 'invalid', message: "Yanlış şasi numarası girdiniz." };
  }

  if (cleanedVin.length < 17) {
    return { status: 'partial', message: `${17 - cleanedVin.length} hane daha girmelisiniz.` };
  }

  return { status: 'valid', message: "Geçerli bir şasi numarası." };
}
