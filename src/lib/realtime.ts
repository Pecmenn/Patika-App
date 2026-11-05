import { AppState } from 'react-native';

import { API_URL } from '@/lib/api';

const MAX_RETRY_MS = 30000;
const UNAUTHORIZED = 4401;

export type ServerEvent = { type: string; [key: string]: unknown };

// Sunucuyla açık bağlantı tutar, koparsa bekleyip yeniden dener.
// onReady, her bağlanışta çağrılır: bağlantı yokken gelenler ekranlara yansısın diye.
export function openEventStream(
  token: string,
  onEvent: (event: ServerEvent) => void,
  onReady: () => void,
) {
  let socket: WebSocket | null = null;
  let isClosed = false;
  let attempts = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function connect() {
    clearTimeout(timer);
    const next = new WebSocket(`${API_URL.replace(/^http/, 'ws')}/v1/events`);
    socket = next;
    // Anahtar adreste değil ilk mesajda gider: adresler kayıt dosyalarına yazılır.
    next.onopen = () => next.send(JSON.stringify({ type: 'auth', token }));
    next.onmessage = ({ data }) => {
      const event = JSON.parse(String(data)) as ServerEvent;
      if (event.type === 'ready') {
        attempts = 0;
        onReady();
      } else {
        onEvent(event);
      }
    };
    next.onclose = ({ code }) => {
      if (socket !== next) {
        return;
      }
      socket = null;
      if (isClosed || code === UNAUTHORIZED) {
        return;
      }
      attempts += 1;
      timer = setTimeout(connect, Math.min(1000 * 2 ** attempts, MAX_RETRY_MS));
    };
  }

  // Uygulama arka plandan dönünce yeniden bağlanır: bağlantı açık görünse de ağ değişince ölmüş olabilir.
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active' && !isClosed) {
      const previous = socket;
      socket = null;
      previous?.close();
      attempts = 0;
      connect();
    }
  });

  connect();

  return () => {
    isClosed = true;
    clearTimeout(timer);
    appState.remove();
    socket?.close();
  };
}
