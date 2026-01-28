/**
 * Converte CPF para formato de email interno
 * Ex: 123.456.789-00 → 12345678900@ultrabanca.app
 */
export function cpfToEmail(cpf: string): string {
  const cpfNumbers = cpf.replace(/\D/g, '');
  return `${cpfNumbers}@ultrabanca.app`;
}

/**
 * Extrai CPF de um email interno
 * Ex: 12345678900@ultrabanca.app → 12345678900
 */
export function emailToCpf(email: string): string {
  return email.replace('@ultrabanca.app', '');
}

/**
 * Valida se o CPF tem 11 dígitos
 */
export function isValidCpf(cpf: string): boolean {
  const cpfNumbers = cpf.replace(/\D/g, '');
  return cpfNumbers.length === 11;
}
