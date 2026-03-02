import { NextResponse } from 'next/server';
import { scrapeResultados } from '@/lib/scraper/resultado-facil';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const estado = searchParams.get('estado') || 'DF';
  const data = searchParams.get('data') || undefined;

  try {
    const resultados = await scrapeResultados(estado, data);

    // TODO: Save to Supabase when configured
    // const supabase = await createClient();
    // for (const resultado of resultados) {
    //   for (const premio of resultado.premios) {
    //     await supabase.from('resultados').upsert({
    //       data: resultado.data,
    //       horario: resultado.horario,
    //       banca: resultado.banca,
    //       [`premio_${premio.posicao}`]: premio.milhar,
    //       [`bicho_${premio.posicao}`]: premio.bicho,
    //     }, {
    //       onConflict: 'data,horario,banca',
    //     });
    //   }
    // }

    return NextResponse.json({ success: true, data: resultados });
  } catch (error) {
    console.error('Scraper error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to scrape results' },
      { status: 500 }
    );
  }
}
