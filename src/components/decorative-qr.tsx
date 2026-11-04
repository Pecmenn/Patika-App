import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/constants/theme';

const MODULES = 25;
const FINDER = 7;

function isInFinderArea(x: number, y: number) {
  const nearStart = FINDER + 1;
  const nearEnd = MODULES - FINDER - 2;
  return (x < nearStart && y < nearStart) || (x > nearEnd && y < nearStart) || (x < nearStart && y > nearEnd);
}

function buildModulesPath(seed: number) {
  let state = seed;
  const nextRandom = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };

  let path = '';
  for (let y = 0; y < MODULES; y++) {
    for (let x = 0; x < MODULES; x++) {
      if (!isInFinderArea(x, y) && nextRandom() > 0.5) {
        path += `M${x} ${y}h1.02v1.02h-1.02z`;
      }
    }
  }
  return path;
}

const MODULES_PATH = buildModulesPath(7);

function FinderSquare({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Rect x={x} y={y} width={FINDER} height={FINDER} fill={colors.ink} />
      <Rect x={x + 1} y={y + 1} width={FINDER - 2} height={FINDER - 2} fill={colors.card} />
      <Rect x={x + 2} y={y + 2} width={FINDER - 4} height={FINDER - 4} fill={colors.ink} />
    </>
  );
}

// Yalnızca süs: Karşılama ekranındaki künyede görünür, gerçek bir bağlantı taşımaz.
export function DecorativeQr({ size }: { size: number }) {
  const viewBoxSize = MODULES + 3;

  return (
    <Svg width={size} height={size} viewBox={`-1.5 -1.5 ${viewBoxSize} ${viewBoxSize}`}>
      <Rect x={-1.5} y={-1.5} width={viewBoxSize} height={viewBoxSize} fill={colors.card} />
      <Path d={MODULES_PATH} fill={colors.ink} />
      <FinderSquare x={0} y={0} />
      <FinderSquare x={MODULES - FINDER} y={0} />
      <FinderSquare x={0} y={MODULES - FINDER} />
    </Svg>
  );
}
