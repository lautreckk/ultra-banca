'use client';

// Tipos de eventos do Facebook Pixel
export type FacebookEvent = 'CompleteRegistration' | 'Purchase' | 'Lead' | 'PageView' | 'InitiateCheckout';

// Parâmetros para eventos com valor
export interface PurchaseEventParams {
  value: number;
  currency?: string;
  eventID?: string;
}

// Declaração global para fbq
declare global {
  interface Window {
    fbq?: (
      action: 'track' | 'init',
      event: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

/**
 * Dispara evento no Facebook Pixel (client-side)
 */
export function trackPixelEvent(
  event: FacebookEvent,
  params?: PurchaseEventParams
): void {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      if (params) {
        window.fbq('track', event, {
          value: params.value,
          currency: params.currency || 'BRL',
          eventID: params.eventID,
        });
      } else {
        window.fbq('track', event);
      }
    } catch {
      // Silently fail - pixel tracking is not critical
    }
  }
}

/**
 * Dispara evento de cadastro completo
 */
export function trackCompleteRegistration(): void {
  trackPixelEvent('CompleteRegistration');
}

/**
 * Dispara evento de compra/depósito
 */
export function trackPurchase(value: number, eventId?: string): void {
  trackPixelEvent('Purchase', {
    value,
    currency: 'BRL',
    eventID: eventId,
  });
}

/**
 * Dispara evento de lead (ex: clique no WhatsApp)
 */
export function trackLead(): void {
  trackPixelEvent('Lead');
}

/**
 * Dispara evento de início de checkout (ex: gerar PIX)
 */
export function trackInitiateCheckout(value: number, eventId?: string): void {
  trackPixelEvent('InitiateCheckout', {
    value,
    currency: 'BRL',
    eventID: eventId,
  });
}

/**
 * Gera ID único para deduplicação de eventos entre Pixel e CAPI
 */
export function generateEventId(prefix: string, id: string): string {
  return `${prefix}_${id}`;
}
