/**
 * Sanitiza parâmetros de busca para uso em filtros PostgREST.
 * Remove metacaracteres que poderiam ser usados para injection.
 */
export function sanitizeSearchParam(input: string): string {
  return input
    .replace(/[%_\\(),.;'"<>{}[\]|&!]/g, '')
    .trim()
    .slice(0, 100);
}

/**
 * Sanitiza input de texto do usuário antes de armazenar no banco.
 * Remove tags HTML e limita tamanho. Permite acentos e apóstrofos em nomes.
 */
export function sanitizeInput(input: string, maxLength = 500): string {
  return input
    .replace(/<[^>]*>/g, '')  // Remove tags HTML
    .replace(/[<>]/g, '')     // Remove < > residuais
    .trim()
    .slice(0, maxLength);
}
