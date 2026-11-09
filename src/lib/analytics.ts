// Tipado global para gtag en el objeto Window
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Helper utilitario para instrumentación de eventos personalizados en Google Analytics 4 (GA4).
 * Incluye `debug_mode: true` para visualizar eventos en tiempo real en GA4 DebugView.
 */
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', eventName, {
      ...params,
      debug_mode: true, // Permite visualizar eventos en DebugView en tiempo real
    });
  }
};

