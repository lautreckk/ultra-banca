export interface Premio {
  posicao: number;
  milhar: string;
  centena: string;
  dezena: string;
  bicho: string;
  grupo: number;
}

export interface ResultadoSorteio {
  id: string;
  data: string;
  horario: string;
  banca: string;
  loteria: string;
  premios: Premio[];
}

export interface ResultadoDB {
  id: string;
  data: string;
  horario: string;
  banca: string;
  loteria: string;
  premio_1?: string;
  premio_2?: string;
  premio_3?: string;
  premio_4?: string;
  premio_5?: string;
  premio_6?: string;
  premio_7?: string;
  premio_8?: string;
  premio_9?: string;
  premio_10?: string;
  bicho_1?: string;
  bicho_2?: string;
  bicho_3?: string;
  bicho_4?: string;
  bicho_5?: string;
  bicho_6?: string;
  bicho_7?: string;
  bicho_8?: string;
  bicho_9?: string;
  bicho_10?: string;
  created_at: string;
}
