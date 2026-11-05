// Patika'nın renkleri ve yazı tipleri. Kaynak: Behance/Patika/styles.css
export const colors = {
  paper: '#F3F2FA',
  card: '#FFFFFF',
  ink: '#1D2452',
  ink2: '#4A5079',
  ink3: '#6E7296',
  line: '#E4E3F0',
  ball: '#D9F26B',
  paw: '#F7BACB',
  pawSoft: '#FDE6EC',
  sky: '#BDD0FF',
  skySoft: '#E6EDFF',
  // Fosforlu tonlar yalnızca kayıp modunda kullanılır.
  alert: '#FF4F1A',
  alertSoft: '#FFE3D8',
  alertText: '#B8330A',
} as const;

// Bu adlar src/app/_layout.tsx içinde yüklenen yazı tipleriyle aynı olmalı.
export const fonts = {
  display: 'Unbounded_700Bold',
  displaySemi: 'Unbounded_600SemiBold',
  ui: 'Figtree_500Medium',
  uiSemi: 'Figtree_600SemiBold',
  uiBold: 'Figtree_700Bold',
  uiHeavy: 'Figtree_800ExtraBold',
} as const;

export const cardShadow =
  '0 1px 2px rgba(29, 36, 82, 0.04), 0 10px 24px -16px rgba(29, 36, 82, 0.18)';
