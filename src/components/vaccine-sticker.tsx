import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/button';
import { colors, fonts } from '@/constants/theme';
import type { Vaccine } from '@/data/vaccines';
import { daysUntil, formatLongDate, formatShortDate, fromDateKey } from '@/lib/dates';
import { dueCountLabel } from '@/lib/vaccines';

const CORNER = 20;

// Veterinerin karneye yapıştırdığı etiketin görünümü: kesik çizgi ve kalkık köşe.
function StickerFrame({ isDue, children }: { isDue: boolean; children: ReactNode }) {
  return (
    <View style={[styles.frame, isDue && styles.frameDue]}>
      <View pointerEvents="none" style={[styles.dashes, isDue && styles.dashesDue]} />
      {children}
      <Svg
        height={CORNER}
        pointerEvents="none"
        style={styles.corner}
        viewBox={`0 0 ${CORNER} ${CORNER}`}
        width={CORNER}>
        <Path d={`M${CORNER} 0V${CORNER}H0Z`} fill={colors.paper} />
        <Path d={`M5 0H${CORNER}L0 ${CORNER}V5A5 5 0 0 1 5 0Z`} fill={isDue ? '#B8D24A' : '#DCDBEE'} />
      </Svg>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

type StickerBodyProps = {
  name: string;
  onEdit: () => void;
  children: ReactNode;
};

// Kartın yazılı kısmı düzenlemeyi açar. Bütün kart değil, çünkü yanındaki "Yapıldı" düğmesi ayrı kalmalı.
function StickerBody({ name, onEdit, children }: StickerBodyProps) {
  return (
    <Pressable
      accessibilityHint="Düzenlemek için dokun"
      accessibilityRole="button"
      onPress={onEdit}
      style={({ pressed }) => [styles.body, pressed && styles.bodyPressed]}>
      <View style={styles.nameRow}>
        <Text style={styles.name}>{name}</Text>
        <CaretRightIcon size={14} weight="bold" color={colors.ink2} />
      </View>
      {children}
    </Pressable>
  );
}

type VaccineStickerProps = {
  vaccine: Vaccine;
  onEdit: () => void;
};

export function VaccineSticker({ vaccine, onEdit }: VaccineStickerProps) {
  return (
    <StickerFrame isDue={false}>
      <StickerBody name={vaccine.name} onEdit={onEdit}>
        <View style={styles.meta}>
          <Meta label="Yapıldı" value={formatShortDate(fromDateKey(vaccine.givenDate))} />
          {vaccine.nextDueDate && (
            <Meta label="Sonraki" value={formatShortDate(fromDateKey(vaccine.nextDueDate))} />
          )}
          {vaccine.batch && <Meta label="Seri no" value={vaccine.batch} />}
        </View>
        <View style={styles.source}>
          <PencilSimpleIcon size={13} weight="bold" color={colors.ink2} />
          <Text style={styles.sourceLabel}>Elle girildi</Text>
        </View>
      </StickerBody>
    </StickerFrame>
  );
}

type DueVaccineStickerProps = VaccineStickerProps & {
  onDone: () => void;
};

export function DueVaccineSticker({ vaccine, onDone, onEdit }: DueVaccineStickerProps) {
  const dueDate = vaccine.nextDueDate ?? vaccine.givenDate;
  const days = daysUntil(dueDate);

  return (
    <StickerFrame isDue>
      <StickerBody name={vaccine.name} onEdit={onEdit}>
        <Text style={styles.lastDose}>
          Son doz: {formatShortDate(fromDateKey(vaccine.givenDate))}
        </Text>
        <Text style={styles.dueDate}>
          {Math.abs(days)} {dueCountLabel(days)}, {formatLongDate(fromDateKey(dueDate))}
        </Text>
      </StickerBody>
      <Button label="Yapıldı" size="small" onPress={onDone} />
    </StickerFrame>
  );
}

const styles = StyleSheet.create({
  frame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 18,
    paddingRight: 14,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  frameDue: {
    backgroundColor: colors.ball,
  },
  dashes: {
    position: 'absolute',
    top: 5,
    right: 5,
    bottom: 5,
    left: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D6D5E8',
  },
  dashesDue: {
    borderColor: 'rgba(29, 36, 82, 0.22)',
  },
  corner: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  bodyPressed: {
    opacity: 0.6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.displaySemi,
    fontSize: 17,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  lastDose: {
    marginTop: 2,
    fontFamily: fonts.ui,
    fontSize: 13.5,
    color: colors.ink2,
  },
  dueDate: {
    marginTop: 8,
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.ink,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 10,
  },
  metaLabel: {
    fontFamily: fonts.uiSemi,
    fontSize: 11.5,
    color: colors.ink3,
  },
  metaValue: {
    marginTop: 1,
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    color: colors.ink,
  },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: colors.paper,
  },
  sourceLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 12.5,
    color: colors.ink2,
  },
});
