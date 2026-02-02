export interface SubLoteria {
  id: string;
  nome: string;
  horario: string;
}

export interface Banca {
  id: string;
  nome: string;
  subLoterias: SubLoteria[];
}

export const BANCAS: Banca[] = [
  // RIO DE JANEIRO (horários dos resultados: 09:20, 11:00, 14:20, 16:00, 18:20, 21:20)
  {
    id: 'rio_federal',
    nome: 'RIO/FEDERAL',
    subLoterias: [
      { id: 'rj_pt_09', nome: 'PT', horario: '09:20' },
      { id: 'rj_ptm_11', nome: 'PTM', horario: '11:00' },
      { id: 'rj_pt_14', nome: 'PT', horario: '14:20' },
      { id: 'rj_ptv_16', nome: 'PTV', horario: '16:00' },
      { id: 'rj_ptn_18', nome: 'PTN', horario: '18:20' },
      { id: 'rj_coruja_21', nome: 'CORUJA', horario: '21:20' },
    ],
  },
  // BAHIA (horários dos resultados: 10:00, 12:00, 15:00, 19:00, 20:00, 21:00)
  {
    id: 'bahia',
    nome: 'BAHIA',
    subLoterias: [
      { id: 'ba_10', nome: 'BAHIA', horario: '10:00' },
      { id: 'ba_12', nome: 'BAHIA', horario: '12:00' },
      { id: 'ba_15', nome: 'BAHIA', horario: '15:00' },
      { id: 'ba_19', nome: 'BAHIA', horario: '19:00' },
      { id: 'ba_20', nome: 'BAHIA', horario: '20:00' },
      { id: 'ba_21', nome: 'BAHIA', horario: '21:00' },
      { id: 'ba_maluca_10', nome: 'MALUCA', horario: '10:00' },
      { id: 'ba_maluca_12', nome: 'MALUCA', horario: '12:00' },
      { id: 'ba_maluca_15', nome: 'MALUCA', horario: '15:00' },
      { id: 'ba_maluca_19', nome: 'MALUCA', horario: '19:00' },
      { id: 'ba_maluca_20', nome: 'MALUCA', horario: '20:00' },
      { id: 'ba_maluca_21', nome: 'MALUCA', horario: '21:00' },
    ],
  },
  // GOIÁS (horários dos resultados: 07:00, 09:00, 11:00, 14:00, 16:00, 18:00, 21:00, 23:00)
  {
    id: 'look_goias',
    nome: 'LOOK/GOIAS',
    subLoterias: [
      { id: 'go_07', nome: 'LOOK', horario: '07:00' },
      { id: 'go_09', nome: 'LOOK', horario: '09:00' },
      { id: 'go_11', nome: 'LOOK', horario: '11:00' },
      { id: 'go_14', nome: 'LOOK', horario: '14:00' },
      { id: 'go_16', nome: 'LOOK', horario: '16:00' },
      { id: 'go_18', nome: 'LOOK', horario: '18:00' },
      { id: 'go_21', nome: 'LOOK', horario: '21:00' },
      { id: 'go_23', nome: 'LOOK', horario: '23:00' },
    ],
  },
  // CEARÁ (horários dos resultados: 11:00, 12:00, 14:00, 15:45, 19:00)
  {
    id: 'lotece',
    nome: 'LOTECE',
    subLoterias: [
      { id: 'ce_11', nome: 'LOTECE', horario: '11:00' },
      { id: 'ce_12', nome: 'LOTECE', horario: '12:00' },
      { id: 'ce_14', nome: 'LOTECE', horario: '14:00' },
      { id: 'ce_15', nome: 'LOTECE', horario: '15:45' },
      { id: 'ce_19', nome: 'LOTECE', horario: '19:00' },
    ],
  },
  // PERNAMBUCO (LOTEP) (horários: 09:20, 09:30, 09:40, 10:00, 11:00, 12:40, 12:45, 14:00, 15:40, 15:45, 17:00, 18:30, 19:00, 19:30, 20:00, 21:00)
  {
    id: 'lotep_pe',
    nome: 'LOTEP/PE',
    subLoterias: [
      { id: 'pe_09', nome: 'LOTEP', horario: '09:20' },
      { id: 'pe_09b', nome: 'LOTEP', horario: '09:30' },
      { id: 'pe_09c', nome: 'LOTEP', horario: '09:40' },
      { id: 'pe_10', nome: 'LOTEP', horario: '10:00' },
      { id: 'pe_11', nome: 'LOTEP', horario: '11:00' },
      { id: 'pe_12', nome: 'LOTEP', horario: '12:40' },
      { id: 'pe_12b', nome: 'LOTEP', horario: '12:45' },
      { id: 'pe_14', nome: 'LOTEP', horario: '14:00' },
      { id: 'pe_15', nome: 'LOTEP', horario: '15:40' },
      { id: 'pe_15b', nome: 'LOTEP', horario: '15:45' },
      { id: 'pe_17', nome: 'LOTEP', horario: '17:00' },
      { id: 'pe_18', nome: 'LOTEP', horario: '18:30' },
      { id: 'pe_19', nome: 'LOTEP', horario: '19:00' },
      { id: 'pe_19b', nome: 'LOTEP', horario: '19:30' },
      { id: 'pe_20', nome: 'LOTEP', horario: '20:00' },
      { id: 'pe_21', nome: 'LOTEP', horario: '21:00' },
    ],
  },
  // PARAÍBA (com LOTEP e CAMPINA GRANDE)
  {
    id: 'paraiba',
    nome: 'PARAIBA',
    subLoterias: [
      { id: 'pb_09', nome: 'PARAIBA', horario: '09:45' },
      { id: 'pb_10', nome: 'PARAIBA', horario: '10:45' },
      { id: 'pb_12', nome: 'PARAIBA', horario: '12:45' },
      { id: 'pb_15', nome: 'PARAIBA', horario: '15:45' },
      { id: 'pb_18', nome: 'PARAIBA', horario: '18:00' },
      { id: 'pb_19', nome: 'PARAIBA', horario: '19:05' },
      { id: 'pb_20', nome: 'PARAIBA', horario: '20:00' },
      { id: 'pb_lotep_10', nome: 'LOTEP', horario: '10:45' },
      { id: 'pb_lotep_12', nome: 'LOTEP', horario: '12:45' },
      { id: 'pb_lotep_15', nome: 'LOTEP', horario: '15:45' },
      { id: 'pb_lotep_18', nome: 'LOTEP', horario: '18:00' },
    ],
  },
  // SÃO PAULO (horários dos resultados: 08:00, 10:00, 12:00, 13:00, 15:30, 17:00, 18:00, 19:00, 20:00)
  {
    id: 'sao_paulo',
    nome: 'SAO-PAULO',
    subLoterias: [
      { id: 'sp_08', nome: 'SP', horario: '08:00' },
      { id: 'sp_10', nome: 'SP', horario: '10:00' },
      { id: 'sp_12', nome: 'SP', horario: '12:00' },
      { id: 'sp_13', nome: 'SP', horario: '13:00' },
      { id: 'sp_15', nome: 'SP', horario: '15:30' },
      { id: 'sp_17', nome: 'SP', horario: '17:00' },
      { id: 'sp_18', nome: 'SP', horario: '18:00' },
      { id: 'sp_19', nome: 'SP', horario: '19:00' },
      { id: 'sp_ptn_20', nome: 'PTN', horario: '20:00' },
    ],
  },
  // MINAS GERAIS (horários dos resultados: 12:00, 13:00, 15:00, 19:00, 21:00)
  {
    id: 'minas_gerais',
    nome: 'MINAS-GERAIS',
    subLoterias: [
      { id: 'mg_12', nome: 'ALVORADA', horario: '12:00' },
      { id: 'mg_13', nome: 'MG', horario: '13:00' },
      { id: 'mg_15', nome: 'DIA', horario: '15:00' },
      { id: 'mg_19', nome: 'NOITE', horario: '19:00' },
      { id: 'mg_21', nome: 'PREFERIDA', horario: '21:00' },
    ],
  },
  // DISTRITO FEDERAL (LBR) (horários: 00:40, 07:30, 08:30, 10:00, 12:40, 13:00, 15:00, 17:00, 18:40, 19:00, 20:40, 22:00, 23:00)
  {
    id: 'lbr',
    nome: 'LBR/BRASILIA',
    subLoterias: [
      { id: 'df_00', nome: 'LBR', horario: '00:40' },
      { id: 'df_07', nome: 'LBR', horario: '07:30' },
      { id: 'df_08', nome: 'LBR', horario: '08:30' },
      { id: 'df_10', nome: 'LBR', horario: '10:00' },
      { id: 'df_12', nome: 'LBR', horario: '12:40' },
      { id: 'df_13', nome: 'LBR', horario: '13:00' },
      { id: 'df_15', nome: 'LBR', horario: '15:00' },
      { id: 'df_17', nome: 'LBR', horario: '17:00' },
      { id: 'df_18', nome: 'LBR', horario: '18:40' },
      { id: 'df_19', nome: 'LBR', horario: '19:00' },
      { id: 'df_20', nome: 'LBR', horario: '20:40' },
      { id: 'df_22', nome: 'LBR', horario: '22:00' },
      { id: 'df_23', nome: 'LBR', horario: '23:00' },
    ],
  },
  // NACIONAL
  {
    id: 'nacional',
    nome: 'NACIONAL',
    subLoterias: [
      { id: 'nac_12', nome: 'NACIONAL', horario: '12:00' },
      { id: 'nac_15', nome: 'NACIONAL', horario: '15:00' },
      { id: 'nac_17', nome: 'NACIONAL', horario: '17:00' },
      { id: 'nac_21', nome: 'NACIONAL', horario: '21:00' },
    ],
  },
  // RIO GRANDE DO NORTE (horários dos resultados: 08:30, 11:45, 16:45, 18:30)
  {
    id: 'rn',
    nome: 'RIO-GRANDE-NORTE',
    subLoterias: [
      { id: 'rn_08', nome: 'RN', horario: '08:30' },
      { id: 'rn_11', nome: 'RN', horario: '11:45' },
      { id: 'rn_16', nome: 'RN', horario: '16:45' },
      { id: 'rn_18', nome: 'RN', horario: '18:30' },
    ],
  },
  // RIO GRANDE DO SUL
  {
    id: 'rs',
    nome: 'RIO-GRANDE-SUL',
    subLoterias: [
      { id: 'rs_14', nome: 'RS', horario: '14:00' },
      { id: 'rs_18', nome: 'RS', horario: '18:00' },
    ],
  },
  // SERGIPE (horários dos resultados: 10:00, 13:00, 14:00, 16:00, 19:00)
  {
    id: 'sergipe',
    nome: 'SERGIPE',
    subLoterias: [
      { id: 'se_10', nome: 'SERGIPE', horario: '10:00' },
      { id: 'se_13', nome: 'SERGIPE', horario: '13:00' },
      { id: 'se_14', nome: 'SERGIPE', horario: '14:00' },
      { id: 'se_16', nome: 'SERGIPE', horario: '16:00' },
      { id: 'se_19', nome: 'SERGIPE', horario: '19:00' },
    ],
  },
  // PARANÁ (pode não ter resultados todos os dias)
  {
    id: 'parana',
    nome: 'PARANA',
    subLoterias: [
      { id: 'pr_14', nome: 'PARANA', horario: '14:00' },
      { id: 'pr_18', nome: 'PARANA', horario: '18:00' },
    ],
  },
  // FEDERAL (Quarta e Sábado)
  {
    id: 'federal',
    nome: 'FEDERAL',
    subLoterias: [
      { id: 'fed_19', nome: 'FEDERAL', horario: '19:00' },
    ],
  },
];

export function getBancaById(id: string): Banca | undefined {
  return BANCAS.find((b) => b.id === id);
}

export function getSubLoteriaById(id: string): SubLoteria | undefined {
  for (const banca of BANCAS) {
    const sub = banca.subLoterias.find((s) => s.id === id);
    if (sub) return sub;
  }
  return undefined;
}
