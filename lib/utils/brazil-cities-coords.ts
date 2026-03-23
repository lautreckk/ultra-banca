export const BRAZIL_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  // State Capitals
  'São Paulo': { lat: -23.55, lng: -46.63 },
  'Sao Paulo': { lat: -23.55, lng: -46.63 },
  'Rio de Janeiro': { lat: -22.91, lng: -43.17 },
  'Brasília': { lat: -15.79, lng: -47.88 },
  'Brasilia': { lat: -15.79, lng: -47.88 },
  'Salvador': { lat: -12.97, lng: -38.51 },
  'Fortaleza': { lat: -3.72, lng: -38.53 },
  'Belo Horizonte': { lat: -19.92, lng: -43.94 },
  'Manaus': { lat: -3.12, lng: -60.02 },
  'Curitiba': { lat: -25.43, lng: -49.27 },
  'Recife': { lat: -8.05, lng: -34.87 },
  'Goiânia': { lat: -16.68, lng: -49.25 },
  'Goiania': { lat: -16.68, lng: -49.25 },
  'Belém': { lat: -1.46, lng: -48.50 },
  'Belem': { lat: -1.46, lng: -48.50 },
  'Porto Alegre': { lat: -30.03, lng: -51.23 },
  'São Luís': { lat: -2.53, lng: -44.28 },
  'Sao Luis': { lat: -2.53, lng: -44.28 },
  'Maceió': { lat: -9.67, lng: -35.74 },
  'Maceio': { lat: -9.67, lng: -35.74 },
  'Campo Grande': { lat: -20.44, lng: -54.65 },
  'Teresina': { lat: -5.09, lng: -42.80 },
  'João Pessoa': { lat: -7.12, lng: -34.86 },
  'Joao Pessoa': { lat: -7.12, lng: -34.86 },
  'Natal': { lat: -5.79, lng: -35.21 },
  'Aracaju': { lat: -10.91, lng: -37.07 },
  'Cuiabá': { lat: -15.60, lng: -56.10 },
  'Cuiaba': { lat: -15.60, lng: -56.10 },
  'Florianópolis': { lat: -27.60, lng: -48.55 },
  'Florianopolis': { lat: -27.60, lng: -48.55 },
  'Vitória': { lat: -20.32, lng: -40.34 },
  'Vitoria': { lat: -20.32, lng: -40.34 },
  'Porto Velho': { lat: -8.76, lng: -63.90 },
  'Macapá': { lat: 0.03, lng: -51.07 },
  'Macapa': { lat: 0.03, lng: -51.07 },
  'Rio Branco': { lat: -9.97, lng: -67.81 },
  'Boa Vista': { lat: 2.82, lng: -60.67 },
  'Palmas': { lat: -10.18, lng: -48.33 },

  // Major cities (non-capitals)
  'Guarulhos': { lat: -23.46, lng: -46.53 },
  'Campinas': { lat: -22.91, lng: -47.06 },
  'Santos': { lat: -23.96, lng: -46.33 },
  'Ribeirão Preto': { lat: -21.18, lng: -47.81 },
  'Ribeirao Preto': { lat: -21.18, lng: -47.81 },
  'Sorocaba': { lat: -23.50, lng: -47.46 },
  'São José dos Campos': { lat: -23.18, lng: -45.88 },
  'Sao Jose dos Campos': { lat: -23.18, lng: -45.88 },
  'Osasco': { lat: -23.53, lng: -46.79 },
  'Uberlândia': { lat: -18.92, lng: -48.28 },
  'Uberlandia': { lat: -18.92, lng: -48.28 },
  'Contagem': { lat: -19.93, lng: -44.05 },
  'Niterói': { lat: -22.88, lng: -43.10 },
  'Niteroi': { lat: -22.88, lng: -43.10 },
  'São Gonçalo': { lat: -22.83, lng: -43.06 },
  'Sao Goncalo': { lat: -22.83, lng: -43.06 },
  'Duque de Caxias': { lat: -22.79, lng: -43.31 },
  'Joinville': { lat: -26.30, lng: -48.84 },
  'Londrina': { lat: -23.31, lng: -51.16 },
  'Maringá': { lat: -23.42, lng: -51.94 },
  'Maringa': { lat: -23.42, lng: -51.94 },
  'Feira de Santana': { lat: -12.27, lng: -38.97 },
  'Aparecida de Goiânia': { lat: -16.82, lng: -49.24 },
  'Aparecida de Goiania': { lat: -16.82, lng: -49.24 },
  'Ananindeua': { lat: -1.37, lng: -48.39 },
  'Caruaru': { lat: -8.28, lng: -35.98 },
  'Petrolina': { lat: -9.39, lng: -40.50 },
  'Juiz de Fora': { lat: -21.76, lng: -43.35 },
  'Montes Claros': { lat: -16.73, lng: -43.86 },
  'Imperatriz': { lat: -5.52, lng: -47.47 },
  'Várzea Grande': { lat: -15.65, lng: -56.13 },
  'Varzea Grande': { lat: -15.65, lng: -56.13 },
  'Dourados': { lat: -22.22, lng: -54.81 },
  'Rondonópolis': { lat: -16.47, lng: -54.64 },
  'Rondonopolis': { lat: -16.47, lng: -54.64 },
  'Sinop': { lat: -11.86, lng: -55.51 },
  'Caxias do Sul': { lat: -29.17, lng: -51.18 },
  'Pelotas': { lat: -31.77, lng: -52.34 },
};

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function findCityCoords(city: string): { lat: number; lng: number } | null {
  // Try exact match first
  if (BRAZIL_CITY_COORDS[city]) {
    return BRAZIL_CITY_COORDS[city];
  }

  // Try normalized match
  const normalizedInput = normalize(city);
  for (const [key, coords] of Object.entries(BRAZIL_CITY_COORDS)) {
    if (normalize(key) === normalizedInput) {
      return coords;
    }
  }

  // Fallback: try state capital
  return null;
}

// Fallback: get approximate coords from state/region name
const STATE_CAPITAL_COORDS: Record<string, { lat: number; lng: number }> = {
  'Acre': { lat: -9.97, lng: -67.81 },
  'Alagoas': { lat: -9.67, lng: -35.74 },
  'Amapá': { lat: 0.03, lng: -51.07 },
  'Amazonas': { lat: -3.12, lng: -60.02 },
  'Bahia': { lat: -12.97, lng: -38.51 },
  'Ceará': { lat: -3.72, lng: -38.53 },
  'Distrito Federal': { lat: -15.79, lng: -47.88 },
  'Espírito Santo': { lat: -20.32, lng: -40.34 },
  'Goiás': { lat: -16.68, lng: -49.25 },
  'Maranhão': { lat: -2.53, lng: -44.28 },
  'Mato Grosso': { lat: -15.60, lng: -56.10 },
  'Mato Grosso do Sul': { lat: -20.44, lng: -54.65 },
  'Minas Gerais': { lat: -19.92, lng: -43.94 },
  'Pará': { lat: -1.46, lng: -48.50 },
  'Paraíba': { lat: -7.12, lng: -34.86 },
  'Paraná': { lat: -25.43, lng: -49.27 },
  'Pernambuco': { lat: -8.05, lng: -34.87 },
  'Piauí': { lat: -5.09, lng: -42.80 },
  'Rio de Janeiro': { lat: -22.91, lng: -43.17 },
  'Rio Grande do Norte': { lat: -5.79, lng: -35.21 },
  'Rio Grande do Sul': { lat: -30.03, lng: -51.23 },
  'Rondônia': { lat: -8.76, lng: -63.90 },
  'Roraima': { lat: 2.82, lng: -60.67 },
  'Santa Catarina': { lat: -27.60, lng: -48.55 },
  'São Paulo': { lat: -23.55, lng: -46.63 },
  'Sergipe': { lat: -10.91, lng: -37.07 },
  'Tocantins': { lat: -10.18, lng: -48.33 },
  // Non-accented versions
  'Ceara': { lat: -3.72, lng: -38.53 },
  'Espirito Santo': { lat: -20.32, lng: -40.34 },
  'Goias': { lat: -16.68, lng: -49.25 },
  'Maranhao': { lat: -2.53, lng: -44.28 },
  'Para': { lat: -1.46, lng: -48.50 },
  'Paraiba': { lat: -7.12, lng: -34.86 },
  'Parana': { lat: -25.43, lng: -49.27 },
  'Piaui': { lat: -5.09, lng: -42.80 },
  'Rondonia': { lat: -8.76, lng: -63.90 },
  'Sao Paulo': { lat: -23.55, lng: -46.63 },
  // Portugal (for international users)
  'Coimbra': { lat: 40.21, lng: -8.43 },
  'Lisboa': { lat: 38.72, lng: -9.14 },
  'Porto': { lat: 41.15, lng: -8.61 },
};

export function findCoordsFromRegion(region: string): { lat: number; lng: number } | null {
  if (STATE_CAPITAL_COORDS[region]) return STATE_CAPITAL_COORDS[region];
  const normalizedRegion = normalize(region);
  for (const [key, coords] of Object.entries(STATE_CAPITAL_COORDS)) {
    if (normalize(key) === normalizedRegion) return coords;
  }
  return null;
}
