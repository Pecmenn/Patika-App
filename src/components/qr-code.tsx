import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/constants/theme';
import { QR_QUIET_ZONE, qrModules, qrPath } from '@/lib/qr';

type QrCodeProps = {
  value: string;
  size: number;
};

// Okunabilen gerçek QR kodu. Karşılama ekranındaki süs için DecorativeQr kullanılır.
export function QrCode({ value, size }: QrCodeProps) {
  const modules = qrModules(value);
  const total = modules.length + QR_QUIET_ZONE * 2;

  return (
    <Svg
      accessibilityLabel="QR kodu"
      height={size}
      viewBox={`${-QR_QUIET_ZONE} ${-QR_QUIET_ZONE} ${total} ${total}`}
      width={size}>
      <Rect fill={colors.card} height={total} width={total} x={-QR_QUIET_ZONE} y={-QR_QUIET_ZONE} />
      <Path d={qrPath(modules)} fill={colors.ink} />
    </Svg>
  );
}
