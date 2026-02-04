const DOMAIN = 'ultrabanca.app';

/**
 * Converte CPF para formato de email multi-tenant
 * Ex: 123.456.789-00 + bancapantanal → 12345678900.bancapantanal@ultrabanca.app
 */
export function cpfToEmail(cpf: string, slug: string): string {
  const cpfNumbers = cpf.replace(/\D/g, '');
  return `${cpfNumbers}.${slug}@${DOMAIN}`;
}

/**
 * Formato legado (para admin login que nao tem plataforma)
 * Ex: 123.456.789-00 → 12345678900@ultrabanca.app
 */
export function cpfToEmailLegacy(cpf: string): string {
  const cpfNumbers = cpf.replace(/\D/g, '');
  return `${cpfNumbers}@${DOMAIN}`;
}

/**
 * Extrai CPF de qualquer formato de email interno
 * Formato novo: 12345678900.bancapantanal@ultrabanca.app → 12345678900
 * Formato legado: 12345678900@ultrabanca.app → 12345678900
 */
export function emailToCpf(email: string): string {
  const local = email.replace(`@${DOMAIN}`, '');
  // CPF tem 11 digitos; se char 11 for '.', formato novo
  return local.length > 11 && local[11] === '.'
    ? local.substring(0, 11)
    : local;
}

/**
 * Valida CPF com verificacao de digitos verificadores
 * Rejeita CPFs invalidos como 111.111.111-11, 999.999.999-99, etc.
 */
export function isValidCpf(cpf: string): boolean {
  const cpfNumbers = cpf.replace(/\D/g, '');

  // Deve ter 11 digitos
  if (cpfNumbers.length !== 11) {
    return false;
  }

  // Rejeita CPFs com todos os digitos iguais
  if (/^(\d)\1{10}$/.test(cpfNumbers)) {
    return false;
  }

  // Validacao do primeiro digito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfNumbers.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfNumbers.charAt(9))) {
    return false;
  }

  // Validacao do segundo digito verificador
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
