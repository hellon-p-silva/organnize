import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/sora/500.css';
import '@fontsource/sora/600.css';
import '@fontsource/sora/700.css';
import App from './App';
import { hasOpenModal } from './components/ui';
import './index.css';

const isNative = Capacitor.isNativePlatform();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Service worker: deixa o app abrir sem internet depois da primeira visita.
if (import.meta.env.PROD && !isNative && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        const urls = [
          location.href.split('#')[0],
          ...performance.getEntriesByType('resource').map((r) => r.name),
        ];
        reg.active?.postMessage({ type: 'CACHE_URLS', urls });
      })
      .catch(() => {
        /* sem SW (ex.: navegador sem suporte) — o app funciona igual online */
      });
  });
}

// Android: botão Voltar fecha o modal aberto; sem modal, sai do app.
if (isNative) {
  void NativeApp.addListener('backButton', () => {
    if (hasOpenModal()) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    else void NativeApp.exitApp();
  });
}
