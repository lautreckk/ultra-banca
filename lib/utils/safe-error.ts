/**
 * Retorna mensagem de erro segura para o cliente.
 * Em produção, nunca expõe detalhes internos (nomes de tabela, colunas, etc).
 */
export function safeError(error: unknown): string {
  if (process.env.NODE_ENV === 'development') {
    return error instanceof Error ? error.message : String(error);
  }
  return 'Erro interno do servidor';
}
