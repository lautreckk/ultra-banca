import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.resultadofacil.com.br/resultado-do-jogo-do-bicho';

export interface ResultadoSorteio {
  data: string;
  horario: string;
  banca: string;
  loteria: string;
  premios: {
    posicao: number;
    milhar: string;
    centena: string;
    dezena: string;
    bicho: string;
    grupo: number;
  }[];
}

// Mapeamento de estados/bancas para URLs
export const BANCAS_CONFIG: Record<string, { url: string; nome: string }> = {
  'RJ': { url: 'RJ', nome: 'RIO/FEDERAL' },
  'NACIONAL': { url: 'NACIONAL', nome: 'NACIONAL' },
  'GO': { url: 'GO', nome: 'LOOK/GOIAS' },
  'PE': { url: 'PE', nome: 'LOTEP' },
  'BA': { url: 'BA', nome: 'BAHIA' },
  'CE': { url: 'CE', nome: 'LOTECE' },
  'SP': { url: 'SP', nome: 'SAO-PAULO' },
  'MG': { url: 'MG', nome: 'MINAS-GERAIS' },
  'PB': { url: 'PB', nome: 'PARAIBA' },
  'DF': { url: 'DF', nome: 'BRASILIA' },
};

export async function scrapeResultados(
  estado: string = 'RJ',
  data?: string
): Promise<ResultadoSorteio[]> {
  const url = `${BASE_URL}/${estado}${data ? `/${data}` : ''}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  return parseResultadosHtml(html, estado);
}

export function parseResultadosHtml(html: string, estado: string): ResultadoSorteio[] {
  const $ = cheerio.load(html);
  const resultados: ResultadoSorteio[] = [];

  // Extrair data da página (formato: "dia DD de MES de AAAA")
  let dataResultado = '';
  const titleMatch = $('title').text().match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (titleMatch) {
    dataResultado = `${titleMatch[3]}-${titleMatch[2]}-${titleMatch[1]}`;
  } else {
    // Fallback: usar data atual
    const hoje = new Date();
    dataResultado = hoje.toISOString().split('T')[0];
  }

  // Buscar todos os headers h3 com classe "g" que contêm info do sorteio
  // Formato: "Resultado do Jogo do Bicho RJ, 09:20, PT, 1º ao 5º"
  // ou: "Resultado do Jogo do Bicho LBR, 00:40"
  $('h3.g').each((_, headerEl) => {
    const headerText = $(headerEl).text().trim();

    // Parse do header para extrair informações
    const parsed = parseHeader(headerText, estado);
    if (!parsed) return;

    // Buscar a tabela imediatamente após o header
    // A estrutura pode variar, então buscamos a próxima tabela
    let $table = $(headerEl).next('table');
    if (!$table.length) {
      // Tentar buscar dentro de um container
      $table = $(headerEl).nextAll('table').first();
    }
    if (!$table.length) {
      // Buscar tabela no próximo elemento que pode ser um div
      const $next = $(headerEl).next();
      $table = $next.find('table').first();
    }

    if (!$table.length) return;

    const premios: ResultadoSorteio['premios'] = [];

    // Cada linha da tabela (exceto header)
    $table.find('tr').each((i, rowEl) => {
      const $row = $(rowEl);
      const tds = $row.find('td');

      if (tds.length >= 4) {
        const posicaoText = $(tds[0]).text().trim(); // "1º", "2º", etc.
        const milhar = $(tds[1]).text().trim();      // "0595"
        const grupoText = $(tds[2]).text().trim();   // "24"
        const bicho = $(tds[3]).text().trim();       // "Veado"

        const posicao = parseInt(posicaoText.replace(/[^\d]/g, '')) || (i + 1);
        const grupo = parseInt(grupoText) || 0;

        if (milhar && milhar.length >= 2) {
          premios.push({
            posicao,
            milhar: milhar.padStart(4, '0'),
            centena: milhar.slice(-3).padStart(3, '0'),
            dezena: milhar.slice(-2).padStart(2, '0'),
            bicho,
            grupo,
          });
        }
      }
    });

    if (premios.length >= 5) {
      resultados.push({
        data: parsed.data || dataResultado,
        horario: parsed.horario,
        banca: BANCAS_CONFIG[estado]?.nome || estado,
        loteria: parsed.loteria,
        premios: premios.slice(0, 7), // Pegar até 7º prêmio
      });
    }
  });

  return resultados;
}

interface ParsedHeader {
  horario: string;
  loteria: string;
  data?: string;
}

function parseHeader(text: string, estado: string): ParsedHeader | null {
  // Formatos possíveis:
  // "Resultado do Jogo do Bicho RJ, 09:20, PT, 1º ao 5º"
  // "Resultado do Jogo do Bicho LBR, 00:40"
  // "PT-RIO, RJ, 09:20, PT - Resultado do dia 27/01/2026"

  // Remover "Resultado do Jogo do Bicho" prefix
  let cleaned = text.replace(/Resultado do Jogo do Bicho\s*/i, '').trim();

  // Extrair horário (formato HH:MM ou HHh ou HH:MMH)
  const horarioMatch = cleaned.match(/(\d{1,2})[h:H](\d{2})?[hH]?/);
  if (!horarioMatch) return null;

  const hora = horarioMatch[1].padStart(2, '0');
  const minuto = horarioMatch[2] || '00';
  const horarioNormalizado = `${hora}:${minuto}`;

  // Extrair loteria/banca específica
  // Padrões: PT, PTM, PTV, PTN, CORUJA, PT-RIO, MALUCA, FEDERAL, LBR
  let loteria = '';
  const loteriaPatterns = [
    /\b(PT-RIO|PTRIO)\b/i,
    /\b(MALUCA)\b/i,
    /\b(FEDERAL)\b/i,
    /\b(CORUJA|COR)\b/i,
    /\b(PTM|MANHA)\b/i,
    /\b(PTV|VESPERTINO)\b/i,
    /\b(PTN|NOITE)\b/i,
    /\b(PT|TARDE)\b/i,
    /\b(LBR)\b/i,
  ];

  for (const pattern of loteriaPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      loteria = normalizeLoteria(match[1]);
      break;
    }
  }

  // Se não encontrou loteria específica, tentar extrair do texto
  if (!loteria) {
    // Extrair tudo após o horário até a vírgula
    const afterTime = cleaned.split(/\d{1,2}[h:H]\d{0,2}[hH]?/)[1];
    if (afterTime) {
      const parts = afterTime.split(',');
      if (parts.length > 0) {
        loteria = parts[0].trim().replace(/[^A-Za-z\-]/g, '').toUpperCase() || 'GERAL';
      }
    }
  }

  // Extrair data se presente no header
  let data: string | undefined;
  const dataMatch = cleaned.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dataMatch) {
    data = `${dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}`;
  }

  return {
    horario: horarioNormalizado,
    loteria: loteria || 'GERAL',
    data,
  };
}

function normalizeLoteria(loteria: string): string {
  const map: Record<string, string> = {
    'PT': 'PT',
    'TARDE': 'PT',
    'PTM': 'PTM',
    'MANHA': 'PTM',
    'PTV': 'PTV',
    'VESPERTINO': 'PTV',
    'PTN': 'PTN',
    'NOITE': 'PTN',
    'CORUJA': 'CORUJA',
    'COR': 'CORUJA',
    'PT-RIO': 'PT-RIO',
    'PTRIO': 'PT-RIO',
    'MALUCA': 'MALUCA',
    'FEDERAL': 'FEDERAL',
    'LBR': 'LBR',
  };
  return map[loteria.toUpperCase()] || loteria.toUpperCase();
}

// Função auxiliar para buscar todos os estados de uma vez
export async function scrapeTodasBancas(): Promise<ResultadoSorteio[]> {
  const estados = Object.keys(BANCAS_CONFIG);
  const resultados: ResultadoSorteio[] = [];
  const errors: string[] = [];

  for (const estado of estados) {
    try {
      const res = await scrapeResultados(estado);
      resultados.push(...res);
    } catch (error) {
      errors.push(`${estado}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  if (errors.length > 0) {
    console.error('Scraping errors:', errors);
  }

  return resultados;
}
