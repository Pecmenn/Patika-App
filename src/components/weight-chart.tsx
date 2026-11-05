import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { colors, fonts } from '@/constants/theme';
import type { WeightEntry, WeightRange } from '@/data/weights';
import { buildWeightChart, formatKg } from '@/lib/weights';

const HEIGHT = 200;
const BUBBLE_HEIGHT = 26;
const BUBBLE_MIN_WIDTH = 66;
const RANGE_COLOR = '#3346A8';
const GRID_COLOR = '#DAD9EA';

type WeightChartProps = {
  // Eskiden yeniye sıralı, en az bir kayıt.
  entries: WeightEntry[];
  range: WeightRange | null;
};

export function WeightChart({ entries, range }: WeightChartProps) {
  const [width, setWidth] = useState(0);
  const latest = entries[entries.length - 1];
  const description = `Kilo grafiği. Son değer ${formatKg(latest.kg)} kilogram.`;

  return (
    <View
      accessible
      accessibilityLabel={description}
      accessibilityRole="image"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.chart}>
      {width > 0 && <ChartDrawing entries={entries} range={range} width={width} />}
    </View>
  );
}

function ChartDrawing({ entries, range, width }: WeightChartProps & { width: number }) {
  const { plot, points, ticks, xLabels, band, last } = buildWeightChart(
    entries,
    range,
    width,
    HEIGHT,
  );
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`);
  const linePath = line.join('');
  const areaPath =
    points.length > 1
      ? `${linePath}V${plot.bottom}H${points[0].x}Z`
      : null;

  const label = `${formatKg(entries[entries.length - 1].kg)} kg`;
  const bubbleWidth = Math.max(BUBBLE_MIN_WIDTH, label.length * 7.4 + 18);
  const bubbleX = Math.min(Math.max(last.x - bubbleWidth / 2, plot.left), width - bubbleWidth);
  const bubbleY = Math.max(last.y - BUBBLE_HEIGHT - 12, 0);

  return (
    <Svg height={HEIGHT} width={width}>
      <Defs>
        <LinearGradient id="weightFill" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor={colors.ink} stopOpacity={0.16} />
          <Stop offset="1" stopColor={colors.ink} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {band && (
        <Rect
          fill={colors.skySoft}
          height={Math.max(band.bottom - band.top, 1)}
          rx={10}
          width={plot.right - plot.left + 8}
          x={plot.left - 4}
          y={band.top}
        />
      )}
      {band && (
        <SvgText
          fill={RANGE_COLOR}
          fontFamily={fonts.uiHeavy}
          fontSize={11}
          x={plot.left + 6}
          y={band.top + 15}>
          Sağlıklı aralık
        </SvgText>
      )}

      {ticks.map((tick) => (
        <Line
          key={tick.label}
          stroke={GRID_COLOR}
          strokeDasharray="3 4"
          x1={plot.left - 4}
          x2={plot.right + 4}
          y1={tick.y}
          y2={tick.y}
        />
      ))}
      {ticks.map((tick) => (
        <SvgText
          key={tick.label}
          fill={colors.ink3}
          fontFamily={fonts.uiBold}
          fontSize={10.5}
          x={0}
          y={tick.y + 4}>
          {tick.label}
        </SvgText>
      ))}

      {areaPath && <Path d={areaPath} fill="url(#weightFill)" />}
      {points.length > 1 && (
        <Path
          d={linePath}
          fill="none"
          stroke={colors.ink}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.6}
        />
      )}
      {points.slice(0, -1).map((point) => (
        <Circle
          key={`${point.x}:${point.y}`}
          cx={point.x}
          cy={point.y}
          fill={colors.card}
          r={3.5}
          stroke={colors.ink}
          strokeWidth={2}
        />
      ))}
      <Circle cx={last.x} cy={last.y} fill={colors.ink} r={6.5} stroke={colors.card} strokeWidth={3} />

      <Rect
        fill={colors.ink}
        height={BUBBLE_HEIGHT}
        rx={10}
        width={bubbleWidth}
        x={bubbleX}
        y={bubbleY}
      />
      <SvgText
        fill={colors.card}
        fontFamily={fonts.uiHeavy}
        fontSize={12.5}
        textAnchor="middle"
        x={bubbleX + bubbleWidth / 2}
        y={bubbleY + 17.5}>
        {label}
      </SvgText>

      {xLabels.map((item, index) => (
        <SvgText
          key={item.label}
          fill={colors.ink3}
          fontFamily={fonts.uiBold}
          fontSize={10.5}
          textAnchor={xLabels.length > 1 && index === xLabels.length - 1 ? 'end' : 'middle'}
          x={xLabels.length > 1 && index === xLabels.length - 1 ? plot.right + 6 : item.x}
          y={HEIGHT - 6}>
          {item.label}
        </SvgText>
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  chart: {
    height: HEIGHT,
  },
});
