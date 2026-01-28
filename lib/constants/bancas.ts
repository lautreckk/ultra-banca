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
      { id: 'pt_rio_11', nome: 'PT RIO', horario: '11:20' },
      { id: 'pt_rio_14', nome: 'PT RIO', horario: '14:20' },
      { id: 'pt_rio_16', nome: 'PT RIO', horario: '16:20' },
      { id: 'pt_rio_18', nome: 'PT RIO', horario: '18:20' },
      { id: 'pt_rio_21', nome: 'PT RIO', horario: '21:20' },
      { id: 'maluca_rio_11', nome: 'MALUCA/RIO', horario: '11:20' },
      { id: 'maluca_rio_14', nome: 'MALUCA/RIO', horario: '14:20' },
      { id: 'maluca_rio_16', nome: 'MALUCA/RIO', horario: '16:20' },
      { id: 'maluca_rio_18', nome: 'MALUCA/RIO', horario: '18:20' },
      { id: 'maluca_rio_21', nome: 'MALUCA/RIO', horario: '21:20' },
    ],
  },
  {
    id: 'nacional',
    nome: 'NACIONAL',
    subLoterias: [
      { id: 'nacional_12', nome: 'NACIONAL', horario: '12:00' },
      { id: 'nacional_15', nome: 'NACIONAL', horario: '15:00' },
      { id: 'nacional_19', nome: 'NACIONAL', horario: '19:00' },
      { id: 'nacional_21', nome: 'FEDERAL', horario: '21:00' },
    ],
  },
  {
    id: 'look_goias',
    nome: 'LOOK/GOIAS',
    subLoterias: [
      { id: 'look_11', nome: 'LOOK', horario: '11:20' },
      { id: 'look_14', nome: 'LOOK', horario: '14:20' },
      { id: 'look_16', nome: 'LOOK', horario: '16:20' },
      { id: 'look_18', nome: 'LOOK', horario: '18:20' },
      { id: 'look_21', nome: 'LOOK', horario: '21:20' },
    ],
  },
  {
    id: 'bahia',
    nome: 'BAHIA',
    subLoterias: [
      { id: 'bahia_10', nome: 'BAHIA', horario: '10:00' },
      { id: 'bahia_12', nome: 'BAHIA', horario: '12:00' },
      { id: 'bahia_15', nome: 'BAHIA', horario: '15:00' },
      { id: 'bahia_17', nome: 'BAHIA', horario: '17:00' },
      { id: 'bahia_19', nome: 'BAHIA', horario: '19:00' },
      { id: 'bahia_21', nome: 'BAHIA', horario: '21:00' },
    ],
  },
  {
    id: 'lotep',
    nome: 'LOTEP',
    subLoterias: [
      { id: 'lotep_10', nome: 'LOTEP', horario: '10:00' },
      { id: 'lotep_14', nome: 'LOTEP', horario: '14:00' },
      { id: 'lotep_18', nome: 'LOTEP', horario: '18:00' },
      { id: 'lotep_21', nome: 'LOTEP', horario: '21:00' },
    ],
  },
  {
    id: 'boasorte_goias',
    nome: 'BOASORTE/GOIAS',
    subLoterias: [
      { id: 'boasorte_11', nome: 'BOA SORTE', horario: '11:00' },
      { id: 'boasorte_14', nome: 'BOA SORTE', horario: '14:00' },
      { id: 'boasorte_16', nome: 'BOA SORTE', horario: '16:00' },
      { id: 'boasorte_18', nome: 'BOA SORTE', horario: '18:00' },
      { id: 'boasorte_21', nome: 'BOA SORTE', horario: '21:00' },
    ],
  },
  {
    id: 'lotece',
    nome: 'LOTECE',
    subLoterias: [
      { id: 'lotece_10', nome: 'LOTECE', horario: '10:00' },
      { id: 'lotece_14', nome: 'LOTECE', horario: '14:00' },
      { id: 'lotece_18', nome: 'LOTECE', horario: '18:00' },
      { id: 'lotece_21', nome: 'LOTECE', horario: '21:00' },
    ],
  },
  {
    id: 'sao_paulo',
    nome: 'SÃO-PAULO',
    subLoterias: [
      { id: 'sp_11', nome: 'SP', horario: '11:00' },
      { id: 'sp_14', nome: 'SP', horario: '14:00' },
      { id: 'sp_16', nome: 'SP', horario: '16:00' },
      { id: 'sp_18', nome: 'SP', horario: '18:00' },
      { id: 'sp_21', nome: 'SP', horario: '21:00' },
    ],
  },
  {
    id: 'sorte',
    nome: 'SORTE',
    subLoterias: [
      { id: 'sorte_11', nome: 'SORTE', horario: '11:00' },
      { id: 'sorte_14', nome: 'SORTE', horario: '14:00' },
      { id: 'sorte_16', nome: 'SORTE', horario: '16:00' },
      { id: 'sorte_18', nome: 'SORTE', horario: '18:00' },
      { id: 'sorte_21', nome: 'SORTE', horario: '21:00' },
    ],
  },
  {
    id: 'minas_gerais',
    nome: 'MINAS-GERAIS',
    subLoterias: [
      { id: 'mg_11', nome: 'MG', horario: '11:00' },
      { id: 'mg_14', nome: 'MG', horario: '14:00' },
      { id: 'mg_16', nome: 'MG', horario: '16:00' },
      { id: 'mg_18', nome: 'MG', horario: '18:00' },
      { id: 'mg_21', nome: 'MG', horario: '21:00' },
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
