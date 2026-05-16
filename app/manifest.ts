import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PROMOTE-CONNECT',
    short_name: 'PROMOTE',
    description: 'Plateforme digitale de networking pour salons professionnels PROMOTE',
    start_url: '/feed',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'window-controls-overlay'],
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#0f0f0f',
    categories: ['business', 'networking', 'events'],
    prefer_related_applications: false,
    lang: 'fr',
    dir: 'ltr',
    icons: [
      { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-256x256.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' as const },
    ],
    shortcuts: [
      {
        name: 'Annuaire',
        short_name: 'Exposants',
        description: 'Parcourir le catalogue des exposants',
        url: '/annuaire',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'Chat',
        short_name: 'Messages',
        description: 'Accéder à votre messagerie privée',
        url: '/chat',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'Agenda',
        short_name: 'Programme',
        description: 'Consulter le programme du salon',
        url: '/agenda',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' }],
      },
    ],
  };
}
