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
  {
    id: 'rio_federal',
    nome: 'RIO/FEDERAL',
    subLoterias: [
      { id: 'pt_09', nome: 'PT', horario: '09:20' },
      { id: 'ptm_11', nome: 'PTM', horario: '11:00' },
      { id: 'pt_14', nome: 'PT', horario: '14:20' },
      { id: 'ptv_16', nome: 'PTV', horario: '16:00' },
      { id: 'ptn_18', nome: 'PTN', horario: '18:00' },
      { id: 'coruja_21', nome: 'CORUJA', horario: '21:00' },
    ],
  },
  {
    id: 'nacional',
    nome: 'NACIONAL',
    subLoterias: [
      { id: 'nacional_12', nome: 'NACIONAL', horario: '12:00' },
      { id: 'nacional_15', nome: 'NACIONAL', horario: '15:00' },
      { id: 'nacional_17', nome: 'NACIONAL', horario: '17:00' },
      { id: 'nacional_21', nome: 'NACIONAL', horario: '21:00' },
    ],
  },
  {
    id: 'look_goias',
    nome: 'LOOK/GOIAS',
    subLoterias: [
      { id: 'look_09', nome: 'LOOK', horario: '09:00' },
      { id: 'look_11', nome: 'LOOK', horario: '11:00' },
      { id: 'look_14', nome: 'LOOK', horario: '14:00' },
      { id: 'look_16', nome: 'LOOK', horario: '16:00' },
      { id: 'look_18', nome: 'LOOK', horario: '18:00' },
      { id: 'look_21', nome: 'LOOK', horario: '21:00' },
    ],
  },
  {
    id: 'bahia',
    nome: 'BAHIA',
    subLoterias: [
      { id: 'bahia_10', nome: 'BAHIA', horario: '10:00' },
      { id: 'bahia_12', nome: 'BAHIA', horario: '12:00' },
      { id: 'bahia_15', nome: 'BAHIA', horario: '15:00' },
      { id: 'bahia_19', nome: 'BAHIA', horario: '19:00' },
      { id: 'bahia_21', nome: 'BAHIA', horario: '21:00' },
      { id: 'maluca_10', nome: 'MALUCA', horario: '10:00' },
      { id: 'maluca_12', nome: 'MALUCA', horario: '12:00' },
      { id: 'maluca_15', nome: 'MALUCA', horario: '15:00' },
      { id: 'maluca_19', nome: 'MALUCA', horario: '19:00' },
      { id: 'maluca_21', nome: 'MALUCA', horario: '21:00' },
    ],
  },
  {
    id: 'lotep',
    nome: 'LOTEP',
    subLoterias: [
      { id: 'lotep_10', nome: 'LOTEP', horario: '10:00' },
      { id: 'lotep_11', nome: 'LOTEP', horario: '11:00' },
      { id: 'lotep_12', nome: 'LOTEP', horario: '12:00' },
      { id: 'lotep_14', nome: 'LOTEP', horario: '14:00' },
      { id: 'lotep_15', nome: 'LOTEP', horario: '15:00' },
      { id: 'lotep_18', nome: 'LOTEP', horario: '18:00' },
      { id: 'lotep_19', nome: 'LOTEP', horario: '19:00' },
      { id: 'lotep_21', nome: 'LOTEP', horario: '21:00' },
    ],
  },
  {
    id: 'lotece',
    nome: 'LOTECE',
    subLoterias: [
      { id: 'lotece_11', nome: 'LOTECE', horario: '11:00' },
      { id: 'lotece_14', nome: 'LOTECE', horario: '14:00' },
      { id: 'lotece_15', nome: 'LOTECE', horario: '15:00' },
      { id: 'lotece_19', nome: 'LOTECE', horario: '19:00' },
    ],
  },
  {
    id: 'sao_paulo',
    nome: 'SAO-PAULO',
    subLoterias: [
      { id: 'sp_10', nome: 'SP', horario: '10:00' },
      { id: 'sp_12', nome: 'SP', horario: '12:00' },
      { id: 'sp_13', nome: 'SP', horario: '13:00' },
      { id: 'sp_15', nome: 'SP', horario: '15:00' },
      { id: 'sp_17', nome: 'SP', horario: '17:00' },
      { id: 'sp_19', nome: 'SP', horario: '19:00' },
      { id: 'sp_ptn_20', nome: 'PTN', horario: '20:00' },
    ],
  },
  {
    id: 'minas_gerais',
    nome: 'MINAS-GERAIS',
    subLoterias: [
      { id: 'mg_12', nome: 'MG', horario: '12:00' },
      { id: 'mg_15', nome: 'MG', horario: '15:00' },
      { id: 'mg_19', nome: 'MG', horario: '19:00' },
      { id: 'mg_21', nome: 'MG', horario: '21:00' },
    ],
  },
  {
    id: 'paraiba',
    nome: 'PARAIBA',
    subLoterias: [
      { id: 'pb_09', nome: 'PARAIBA', horario: '09:00' },
      { id: 'pb_10', nome: 'PARAIBA', horario: '10:00' },
      { id: 'pb_12', nome: 'PARAIBA', horario: '12:00' },
      { id: 'pb_15', nome: 'PARAIBA', horario: '15:00' },
      { id: 'pb_18', nome: 'PARAIBA', horario: '18:00' },
      { id: 'pb_19', nome: 'PARAIBA', horario: '19:00' },
    ],
  },
  {
    id: 'lbr',
    nome: 'LBR/BRASILIA',
    subLoterias: [
      { id: 'lbr_08', nome: 'LBR', horario: '08:00' },
      { id: 'lbr_10', nome: 'LBR', horario: '10:00' },
      { id: 'lbr_12', nome: 'LBR', horario: '12:00' },
      { id: 'lbr_15', nome: 'LBR', horario: '15:00' },
      { id: 'lbr_17', nome: 'LBR', horario: '17:00' },
      { id: 'lbr_19', nome: 'LBR', horario: '19:00' },
      { id: 'lbr_20', nome: 'LBR', horario: '20:00' },
      { id: 'lbr_22', nome: 'LBR', horario: '22:00' },
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
