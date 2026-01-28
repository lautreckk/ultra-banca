// Tipos de ação de auditoria
// Este arquivo NÃO usa "use server" para poder exportar constantes

export const AuditActions = {
  // Autenticação
  LOGIN: 'LOGIN',
  LOGIN_ADMIN: 'LOGIN_ADMIN',
  LOGOUT: 'LOGOUT',
  SIGNUP: 'SIGNUP',
  PASSWORD_RESET: 'PASSWORD_RESET',
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_DISABLED: 'MFA_DISABLED',

  // Financeiro - Depósitos
  DEPOSIT_CREATED: 'DEPOSIT_CREATED',
  DEPOSIT_APPROVED: 'DEPOSIT_APPROVED',
  DEPOSIT_REJECTED: 'DEPOSIT_REJECTED',

  // Financeiro - Saques
  WITHDRAWAL_REQUESTED: 'WITHDRAWAL_REQUESTED',
  WITHDRAWAL_APPROVED: 'WITHDRAWAL_APPROVED',
  WITHDRAWAL_REJECTED: 'WITHDRAWAL_REJECTED',

  // Apostas
  BET_PLACED: 'BET_PLACED',
  BET_WON: 'BET_WON',
  BET_CANCELLED: 'BET_CANCELLED',

  // Admin
  USER_UPDATED: 'USER_UPDATED',
  USER_BLOCKED: 'USER_BLOCKED',
  USER_UNBLOCKED: 'USER_UNBLOCKED',
  BALANCE_ADJUSTED: 'BALANCE_ADJUSTED',
  CONFIG_UPDATED: 'CONFIG_UPDATED',
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];

// Tipos para parâmetros de auditoria
export interface LocationInfo {
  city: string;
  region: string;
  country: string;
  countryCode?: string;
  isp?: string;
}

export interface AuditLogParams {
  actorId: string | null;
  action: string;
  entity?: string;
  details?: Record<string, unknown>;
}
