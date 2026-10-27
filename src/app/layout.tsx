import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://shotsygame.com'),
  title: 'Shotsy | Ruleta y Retos para Previas y Amigos',
  description: 'La mejor web app de juegos para beber, Yo Nunca, Verdad o Reto y Ruleta de castigos directo desde tu celular.',
  keywords: ['juegos para previas', 'ruleta de shots', 'yo nunca online', 'verdad o reto picante', 'shotsy'],
  openGraph: {
    title: 'Shotsy | Enciende la Previa',
    description: 'Juega a la ruleta y destapa los retos más extremos con tus amigos desde el navegador.',
    url: 'https://shotsygame.com',
    siteName: 'Shotsy Game',
    locale: 'es_LA',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || '';

  return (
    <html lang="es">
      <body>
        {children}
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
