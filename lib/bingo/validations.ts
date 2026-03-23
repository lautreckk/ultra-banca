import { z } from 'zod';

export const joinGameSchema = z.object({
  roomId: z.string().uuid('ID de sala invalido'),
});

export const tickGameSchema = z.object({
  roomId: z.string().uuid('ID de sala invalido'),
});

export const callBingoSchema = z.object({
  roomId: z.string().uuid('ID de sala invalido'),
});
