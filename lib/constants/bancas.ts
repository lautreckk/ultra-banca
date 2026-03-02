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
  // FEDERAL (Quarta e Sábado) - Sempre no topo
  {
    id: 'federal',
    nome: 'FEDERAL',
    subLoterias: [
      { id: 'fed_19', nome: 'FEDERAL', horario: '19:00' },
    ],
  },
  // RIO DE JANEIRO (horários dos resultados: 09:20, 11:00, 14:20, 16:00, 21:20)
  {
    id: 'rio_federal',
    nome: 'RIO/FEDERAL',
    subLoterias: [
      { id: 'rj_pt_09', nome: 'PT RIO', horario: '09:20' },
      { id: 'rj_pt_09_maluca', nome: 'MALUCA/RIO', horario: '09:20' },
      { id: 'rj_ptm_11', nome: 'PT RIO', horario: '11:00' },
      { id: 'rj_ptm_11_maluca', nome: 'MALUCA/RIO', horario: '11:00' },
      { id: 'rj_pt_14', nome: 'PT RIO', horario: '14:20' },
      { id: 'rj_pt_14_maluca', nome: 'MALUCA/RIO', horario: '14:20' },
      { id: 'rj_ptv_16', nome: 'PT RIO', horario: '16:00' },
      { id: 'rj_ptv_16_maluca', nome: 'MALUCA/RIO', horario: '16:00' },
      { id: 'fed_19', nome: 'FEDERAL', horario: '19:00' },
      { id: 'fed_19_maluca', nome: 'MALUCA/FED', horario: '20:00' },
      { id: 'rj_coruja_21', nome: 'PT RIO', horario: '21:20' },
      { id: 'rj_coruja_21_maluca', nome: 'MALUCA/RIO', horario: '21:20' },
    ],
  },
  // BAHIA - MALUCA tem resultados SEPARADOS (diferentes números)
  {
    id: 'bahia',
    nome: 'BAHIA',
    subLoterias: [
      { id: 'ba_10', nome: 'BAHIA', horario: '10:00' },
      { id: 'ba_maluca_10', nome: 'MALUCA/BA', horario: '10:00' },
      { id: 'ba_12', nome: 'BAHIA', horario: '12:00' },
      { id: 'ba_maluca_12', nome: 'MALUCA/BA', horario: '12:00' },
      { id: 'ba_15', nome: 'BAHIA', horario: '15:00' },
      { id: 'ba_maluca_15', nome: 'MALUCA/BA', horario: '15:00' },
      { id: 'ba_20', nome: 'BAHIA/FEDERAL', horario: '20:00' },
      { id: 'ba_maluca_20', nome: 'MALUCA/BA FED', horario: '20:00' },
      { id: 'ba_21', nome: 'BAHIA', horario: '21:00' },
      { id: 'ba_maluca_21', nome: 'MALUCA/BA', horario: '21:00' },
    ],
  },
  // NACIONAL (horários: 02:00, 08:00, 10:00, 12:00, 15:00, 17:00, 21:00, 23:00)
  {
    id: 'nacional',
    nome: 'NACIONAL',
    subLoterias: [
      { id: 'nac_02', nome: 'NACIONAL', horario: '02:00' },
      { id: 'nac_02_maluca', nome: 'MALUCA/NACIONAL', horario: '02:00' },
      { id: 'nac_08', nome: 'NACIONAL', horario: '08:00' },
      { id: 'nac_08_maluca', nome: 'MALUCA/NACIONAL', horario: '08:00' },
      { id: 'nac_10', nome: 'NACIONAL', horario: '10:00' },
      { id: 'nac_10_maluca', nome: 'MALUCA/NACIONAL', horario: '10:00' },
      { id: 'nac_12', nome: 'NACIONAL', horario: '12:00' },
      { id: 'nac_12_maluca', nome: 'MALUCA/NACIONAL', horario: '12:00' },
      { id: 'nac_15', nome: 'NACIONAL', horario: '15:00' },
      { id: 'nac_15_maluca', nome: 'MALUCA/NACIONAL', horario: '15:00' },
      { id: 'nac_17', nome: 'NACIONAL', horario: '17:00' },
      { id: 'nac_17_maluca', nome: 'MALUCA/NACIONAL', horario: '17:00' },
      { id: 'nac_21', nome: 'NACIONAL', horario: '21:00' },
      { id: 'nac_21_maluca', nome: 'MALUCA/NACIONAL', horario: '21:00' },
      { id: 'nac_23', nome: 'NACIONAL', horario: '23:00' },
      { id: 'nac_23_maluca', nome: 'MALUCA/NACIONAL', horario: '23:00' },
    ],
  },
  // GOIÁS - LOOK (horários: 07:00, 09:00, 11:00, 14:00, 16:00, 18:00, 21:00)
  {
    id: 'look_goias',
    nome: 'LOOK/GOIAS',
    subLoterias: [
      { id: 'go_07', nome: 'LOOK', horario: '07:00' },
      { id: 'go_07_maluca', nome: 'MALUCA/LOOK', horario: '07:00' },
      { id: 'go_09', nome: 'LOOK', horario: '09:00' },
      { id: 'go_09_maluca', nome: 'MALUCA/LOOK', horario: '09:00' },
      { id: 'go_11', nome: 'LOOK', horario: '11:00' },
      { id: 'go_11_maluca', nome: 'MALUCA/LOOK', horario: '11:00' },
      { id: 'go_14', nome: 'LOOK', horario: '14:00' },
      { id: 'go_14_maluca', nome: 'MALUCA/LOOK', horario: '14:00' },
      { id: 'go_16', nome: 'LOOK', horario: '16:00' },
      { id: 'go_16_maluca', nome: 'MALUCA/LOOK', horario: '16:00' },
      { id: 'go_18', nome: 'LOOK', horario: '18:00' },
      { id: 'go_18_maluca', nome: 'MALUCA/LOOK', horario: '18:00' },
      { id: 'go_21', nome: 'LOOK', horario: '21:00' },
      { id: 'go_21_maluca', nome: 'MALUCA/LOOK', horario: '21:00' },
    ],
  },
  // GOIÁS - BOA SORTE (horários: 09:20, 11:20, 14:20, 16:20, 18:20, 21:20)
  {
    id: 'boasorte_goias',
    nome: 'BOASORTE/GOIAS',
    subLoterias: [
      { id: 'bs_09', nome: 'BOASORTE', horario: '09:20' },
      { id: 'bs_09_maluca', nome: 'MALUCA/BOASORTE', horario: '09:20' },
      { id: 'bs_11', nome: 'BOASORTE', horario: '11:20' },
      { id: 'bs_11_maluca', nome: 'MALUCA/BOASORTE', horario: '11:20' },
      { id: 'bs_14', nome: 'BOASORTE', horario: '14:20' },
      { id: 'bs_14_maluca', nome: 'MALUCA/BOASORTE', horario: '14:20' },
      { id: 'bs_16', nome: 'BOASORTE', horario: '16:20' },
      { id: 'bs_16_maluca', nome: 'MALUCA/BOASORTE', horario: '16:20' },
      { id: 'bs_18', nome: 'BOASORTE', horario: '18:20' },
      { id: 'bs_18_maluca', nome: 'MALUCA/BOASORTE', horario: '18:20' },
      { id: 'bs_21', nome: 'BOASORTE', horario: '21:20' },
      { id: 'bs_21_maluca', nome: 'MALUCA/BOASORTE', horario: '21:20' },
    ],
  },
  // LOTEP (PERNAMBUCO) - horários principais
  {
    id: 'lotep_pe',
    nome: 'LOTEP/PE',
    subLoterias: [
      { id: 'pe_09', nome: 'LOTEP', horario: '09:20' },
      { id: 'pe_09_maluca', nome: 'MALUCA/LOTEP', horario: '09:20' },
      { id: 'pe_10', nome: 'LOTEP', horario: '10:00' },
      { id: 'pe_10_maluca', nome: 'MALUCA/LOTEP', horario: '10:00' },
      { id: 'pe_12', nome: 'LOTEP', horario: '12:40' },
      { id: 'pe_12_maluca', nome: 'MALUCA/LOTEP', horario: '12:40' },
      { id: 'pe_15', nome: 'LOTEP', horario: '15:40' },
      { id: 'pe_15_maluca', nome: 'MALUCA/LOTEP', horario: '15:40' },
      { id: 'pe_18', nome: 'LOTEP', horario: '18:30' },
      { id: 'pe_18_maluca', nome: 'MALUCA/LOTEP', horario: '18:30' },
      { id: 'pe_20', nome: 'LOTEP', horario: '20:00' },
      { id: 'pe_20_maluca', nome: 'MALUCA/LOTEP', horario: '20:00' },
    ],
  },
  // CEARÁ - LOTECE (horários: 11:00, 14:00, 15:45, 19:00)
  {
    id: 'lotece',
    nome: 'LOTECE',
    subLoterias: [
      { id: 'ce_11', nome: 'LOTECE', horario: '11:00' },
      { id: 'ce_11_maluca', nome: 'MALUCA/LOTECE', horario: '11:00' },
      { id: 'ce_14', nome: 'LOTECE', horario: '14:00' },
      { id: 'ce_14_maluca', nome: 'MALUCA/LOTECE', horario: '14:00' },
      { id: 'ce_15', nome: 'LOTECE', horario: '15:45' },
      { id: 'ce_15_maluca', nome: 'MALUCA/LOTECE', horario: '15:45' },
      { id: 'ce_19', nome: 'LOTECE', horario: '19:00' },
      { id: 'ce_19_maluca', nome: 'MALUCA/LOTECE', horario: '19:00' },
    ],
  },
  // SÃO PAULO (horários: 08:00, 10:00, 12:00, 13:00, 15:30 BAND, 17:00, 18:00, 19:00)
  {
    id: 'sao_paulo',
    nome: 'SAO-PAULO',
    subLoterias: [
      { id: 'sp_08', nome: 'PT SP', horario: '08:00' },
      { id: 'sp_08_maluca', nome: 'MALUCA/SP', horario: '08:00' },
      { id: 'sp_10', nome: 'PT SP', horario: '10:00' },
      { id: 'sp_10_maluca', nome: 'MALUCA/SP', horario: '10:00' },
      { id: 'sp_12', nome: 'PT SP', horario: '12:00' },
      { id: 'sp_12_maluca', nome: 'MALUCA/SP', horario: '12:00' },
      { id: 'sp_13', nome: 'PT SP', horario: '13:00' },
      { id: 'sp_13_maluca', nome: 'MALUCA/SP', horario: '13:00' },
      { id: 'sp_band_15', nome: 'BAND', horario: '15:30' },
      { id: 'sp_band_15_maluca', nome: 'MALUCA/BAND', horario: '15:30' },
      { id: 'sp_17', nome: 'PT SP', horario: '17:00' },
      { id: 'sp_17_maluca', nome: 'MALUCA/SP', horario: '17:00' },
      { id: 'sp_18', nome: 'PT SP', horario: '18:00' },
      { id: 'sp_18_maluca', nome: 'MALUCA/SP', horario: '18:00' },
      { id: 'sp_19', nome: 'PT SP', horario: '19:00' },
      { id: 'sp_19_maluca', nome: 'MALUCA/SP', horario: '19:00' },
    ],
  },
  // MINAS GERAIS (horários: 12:00 ALVORADA, 15:00 DIA)
  {
    id: 'minas_gerais',
    nome: 'MINAS-GERAIS',
    subLoterias: [
      { id: 'mg_12', nome: 'ALVORADA', horario: '12:00' },
      { id: 'mg_12_maluca', nome: 'MALUCA/ALVORADA', horario: '12:00' },
      { id: 'mg_15', nome: 'DIA', horario: '15:00' },
      { id: 'mg_15_maluca', nome: 'MALUCA/MINAS DIA', horario: '15:00' },
    ],
  },
  // SORTE / RIO GRANDE DO SUL (horários: 11:00, 14:00, 16:00, 18:00, 21:00)
  {
    id: 'rs',
    nome: 'SORTE/RS',
    subLoterias: [
      { id: 'rs_11', nome: 'SORTE', horario: '11:00' },
      { id: 'rs_11_maluca', nome: 'MALUCA/SORTE', horario: '11:00' },
      { id: 'rs_14', nome: 'SORTE', horario: '14:00' },
      { id: 'rs_14_maluca', nome: 'MALUCA/SORTE', horario: '14:00' },
      { id: 'rs_16', nome: 'SORTE', horario: '16:00' },
      { id: 'rs_16_maluca', nome: 'MALUCA/SORTE', horario: '16:00' },
      { id: 'rs_18', nome: 'SORTE', horario: '18:00' },
      { id: 'rs_18_maluca', nome: 'MALUCA/SORTE', horario: '18:00' },
      { id: 'rs_21', nome: 'SORTE', horario: '21:00' },
      { id: 'rs_21_maluca', nome: 'MALUCA/SORTE', horario: '21:00' },
    ],
  },
  // DISTRITO FEDERAL (LBR)
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
  // PARAÍBA (com LOTEP)
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
  // RIO GRANDE DO NORTE
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
  // SERGIPE
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
  // PARANÁ
  {
    id: 'parana',
    nome: 'PARANA',
    subLoterias: [
      { id: 'pr_14', nome: 'PARANA', horario: '14:00' },
      { id: 'pr_18', nome: 'PARANA', horario: '18:00' },
    ],
  },
  // LOTINHA (Lotofácil - Caixa Federal) - Seg, Qua, Sex
  {
    id: 'lotinha',
    nome: 'LOTINHA',
    subLoterias: [
      { id: 'lotinha', nome: 'LOTO FACIL', horario: '20:00' },
    ],
  },
  // QUININHA (Quina - Caixa Federal) - Seg a Sáb
  {
    id: 'quininha',
    nome: 'QUININHA',
    subLoterias: [
      { id: 'quininha', nome: 'SORTEIO QUINA', horario: '20:00' },
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
