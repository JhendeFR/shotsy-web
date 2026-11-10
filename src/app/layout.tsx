import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://shotsy-web.vercel.app'),
  title: 'Shotsy | Juegos para Previas, Ruleta de Shots y Yo Nunca Online',
  description: 'La mejor web app de juegos para beber con amigos. Gira la ruleta de shots personalizada, saca cartas de Yo Nunca y supera retos extremos. ¡Juega gratis sin descargas!',
  keywords: [
    'juegos para previas',
    'ruleta de shots',
    'yo nunca online',
    'verdad o reto picante',
    'shotsy',
    'juegos para tomar con amigos',
    'ruleta para beber',
    'penitencias para fiestas',
    'retos para beber alcohol',
    'juegos de fiesta online',
  ],
  alternates: {
    canonical: 'https://shotsy-web.vercel.app',
  },
  authors: [{ name: 'Shotsy Game' }],
  category: 'Entertainment',
  verification: {
    google: 'ci5PABw_dmGmQf3cbIzqK8JOAstX-9orJsikB22U7bg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Shotsy | Enciende la Previa con Ruleta de Shots y Retos',
    description: 'Gira la ruleta personalizada con nombres de tus amigos, juega Yo Nunca clásico y destapa retos extremos directo desde el navegador.',
    url: 'https://shotsy-web.vercel.app',
    siteName: 'Shotsy Game',
    locale: 'es_LA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shotsy | Juegos para Previas y Ruleta de Shots Online',
    description: 'La web app definitiva para jugar en tus previas. Sin descargas, 100% gratis en tu celular.',
    creator: '@ShotsyGame',
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