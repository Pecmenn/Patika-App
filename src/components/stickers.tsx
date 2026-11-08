import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { CalendarCheckIcon } from 'phosphor-react-native/src/icons/CalendarCheck';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/button';
import { Tappable } from '@/components/tappable';
import { colors, fonts } from '@/constants/theme';
import type { HealthRecord } from '@/data/health-records';
import type { Visit } from '@/data/visits';
import { daysUntil, formatLongDate, formatShortDate, formatTime, fromDateKey } from '@/lib/dates';
import { dueCountLabel } from '@/lib/health-records';
import { visitWhenLabel, isAppointmentVisit } from '@/lib/visits';

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

type StickerBodyProps = {
  name: string;
  onEdit: () => void;
  children: ReactNode;
};

// Kartın yazılı kısmı düzenlemeyi açar. Bütün kart değil, çünkü yanındaki "Yapıldı" düğmesi ayrı kalmalı.
function StickerBody({ name, onEdit, children }: StickerBodyProps) {
  return (
    <Tappable
      accessibilityHint="Düzenlemek için dokun"
      accessibilityRole="button"
      onPress={onEdit}
      style={styles.body}>
      <View style={styles.nameRow}>
        <Text style={styles.name}>{name}</Text>
        <CaretRightIcon size={14} weight="bold" color={colors.ink2} />
      </View>
      {children}
    </Tappable>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function ManualSource() {
  return (
    <View style={styles.source}>
      <PencilSimpleIcon size={13} weight="bold" color={colors.ink2} />
      <Text style={styles.sourceLabel}>Elle girildi</Text>
    </View>
  );
}

function AppointmentSource() {
  return (
    <View style={styles.source}>
      <CalendarCheckIcon size={13} weight="bold" color={colors.ink2} />
      <Text style={styles.sourceLabel}>Patika randevusu</Text>
    </View>
  );
}

type RecordStickerProps = {
  record: HealthRecord;
  onEdit: () => void;
};

export function RecordSticker({ record, onEdit }: RecordStickerProps) {
  return (
    <StickerFrame isDue={false}>
      <StickerBody name={record.name} onEdit={onEdit}>
        {record.note && <Text style={styles.note}>{record.note}</Text>}
        <View style={styles.meta}>
          <Meta label="Yapıldı" value={formatShortDate(fromDateKey(record.givenDate))} />
          {record.nextDueDate && (
            <Meta label="Sonraki" value={formatShortDate(fromDateKey(record.nextDueDate))} />
          )}
          {record.batch && <Meta label="Seri no" value={record.batch} />}
        </View>
        <ManualSource />
      </StickerBody>
    </StickerFrame>
  );
}

type DueRecordStickerProps = RecordStickerProps & {
  // Uygulama ertesi gün açılınca sayaç yenilensin diye dışarıdan geliyor.
  now: Date;
  onDone: () => void;
};

export function DueRecordSticker({ record, now, onDone, onEdit }: DueRecordStickerProps) {
  const dueDate = record.nextDueDate ?? record.givenDate;
  const days = daysUntil(dueDate, now);

  return (
    <StickerFrame isDue>
      <StickerBody name={record.name} onEdit={onEdit}>
        <Text style={styles.lastDose}>
          Son doz: {formatShortDate(fromDateKey(record.givenDate))}
        </Text>
        <Text style={styles.dueDate}>
          {Math.abs(days)} {dueCountLabel(days)}, {formatLongDate(fromDateKey(dueDate))}
        </Text>
      </StickerBody>
      <Button label="Yapıldı" size="small" onPress={onDone} />
    </StickerFrame>
  );
}

type VisitStickerProps = {
  visit: Visit;
  onEdit: () => void;
};

export function VisitSticker({ visit, onEdit }: VisitStickerProps) {
  return (
    <StickerFrame isDue={false}>
      <StickerBody name={visit.reason} onEdit={onEdit}>
        {visit.note && <Text style={styles.note}>{visit.note}</Text>}
        <View style={styles.meta}>
          <Meta label="Tarih" value={formatShortDate(fromDateKey(visit.date))} />
          {visit.time && <Meta label="Saat" value={formatTime(visit.time)} />}
          {visit.clinic && <Meta label="Klinik" value={visit.clinic} />}
        </View>
        {isAppointmentVisit(visit) ? <AppointmentSource /> : <ManualSource />}
      </StickerBody>
    </StickerFrame>
  );
}

export function UpcomingVisitSticker({
  visit,
  now,
  onEdit,
}: VisitStickerProps & { now: Date }) {
  const days = daysUntil(visit.date, now);

  return (
    <StickerFrame isDue>
      <StickerBody name={visit.reason} onEdit={onEdit}>
        {visit.clinic && <Text style={styles.lastDose}>{visit.clinic}</Text>}
        {visit.note && <Text style={styles.lastDose}>{visit.note}</Text>}
        <Text style={styles.dueDate}>
          {days === 0 ? 'Bugün' : `${days} gün kaldı`}, {visitWhenLabel(visit)}
        </Text>
      </StickerBody>
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
  note: {
    marginTop: 3,
    fontFamily: fonts.ui,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.ink2,
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
  metaItem: {
    flexShrink: 1,
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
