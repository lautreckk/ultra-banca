export interface Horario {
  id: string;
  nome: string;
  nomeCompleto: string;
  horaInicio: string;
  horaFim: string;
}

export const HORARIOS: Horario[] = [
  { id: 'PTM', nome: 'PTM', nomeCompleto: 'PTM (Manha)', horaInicio: '10:00', horaFim: '09:45' },
  { id: 'PT', nome: 'PT', nomeCompleto: 'PT (Tarde)', horaInicio: '14:00', horaFim: '13:45' },
  { id: 'PTV', nome: 'PTV', nomeCompleto: 'PTV (Vespertino)', horaInicio: '16:00', horaFim: '15:45' },
  { id: 'PTN', nome: 'PTN', nomeCompleto: 'PTN (Noite)', horaInicio: '19:00', horaFim: '18:45' },
  { id: 'COR', nome: 'COR', nomeCompleto: 'COR (Coruja)', horaInicio: '21:00', horaFim: '20:45' },
];

export function getHorarioById(id: string): Horario | undefined {
  return HORARIOS.find((h) => h.id === id);
}

export function getAvailableHorarios(): Horario[] {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return HORARIOS.filter((h) => currentTime < h.horaFim);
}
