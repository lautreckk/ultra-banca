/**
 * Preserva parâmetros UTM da URL atual à URL de destino
 * @param {string} url - URL de destino para navegação
 * @returns {string} URL com parâmetros UTM anexados
 */
export function getUrlWithUtm(url: string): string {
  // Verificação de ambiente browser (pula no SSR)
  if (typeof window === 'undefined') return url;

  const params = window.location.search;
  if (!params) return url;

  const separator = url.includes('?') ? '&' : '?';
  return url + separator + params.substring(1);
}
