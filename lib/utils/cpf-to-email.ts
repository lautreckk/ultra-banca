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
 * Valida CPF com verificação de dígitos verificadores
 * Rejeita CPFs inválidos como 111.111.111-11, 999.999.999-99, etc.
 */
export function isValidCpf(cpf: string): boolean {
  const cpfNumbers = cpf.replace(/\D/g, '');

  // Deve ter 11 dígitos
  if (cpfNumbers.length !== 11) {
    return false;
  }

  // Rejeita CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cpfNumbers)) {
    return false;
  }

  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfNumbers.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfNumbers.charAt(9))) {
    return false;
  }

  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfNumbers.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfNumbers.charAt(10))) {
    return false;
  }

  return true;
}
