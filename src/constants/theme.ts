// Patika'nın renkleri ve yazı tipleri. Kaynak: Behance/Patika/styles.css
export const colors = {
  paper: '#F3F2FA',
  card: '#FFFFFF',
  ink: '#1D2452',
  ink2: '#4A5079',
  // Kâğıt zeminde de okunabilirlik eşiğini geçsin diye tasarımdaki #6E7296'dan bir ton koyu (4.8:1).
  ink3: '#64688D',
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
  // Geri alınamayan işler (silme). Kayıp turuncusundan ayrı tutulur, turuncu yalnızca kayıp modunun.
  danger: '#B42318',
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

export const TAB_BAR_HEIGHT = 64;

// Alt menü ekranın üstünde yüzer: alttan boşluğu ve içeriğin altında bırakılacak pay.
export function tabBarBottom(bottomInset: number) {
  return Math.max(bottomInset, 12);
}

export function tabBarClearance(bottomInset: number) {
  return tabBarBottom(bottomInset) + TAB_BAR_HEIGHT + 16;
}

export const cardShadow =
  '0 1px 2px rgba(29, 36, 82, 0.04), 0 10px 24px -16px rgba(29, 36, 82, 0.18)';
