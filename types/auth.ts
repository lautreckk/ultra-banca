export interface User {
  id: string;
  cpf: string;
  nome: string;
  telefone?: string;
  unidade_id?: string;
  saldo: number;
  saldo_bonus: number;
  codigo_convite?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  cpf: string;
  senha: string;
}

export interface RegisterData {
  cpf: string;
  nome: string;
  telefone: string;
  senha: string;
  codigo_convite?: string;
}
