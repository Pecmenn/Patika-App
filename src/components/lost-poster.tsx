import { PawPrintIcon } from 'phosphor-react-native/src/icons/PawPrint';
import { useState, type ComponentRef, type Ref } from 'react';
import { Image, PixelRatio, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { QrCode, qrQuietInset } from '@/components/qr-code';
import { SPECIES } from '@/constants/species';
import { colors, fonts } from '@/constants/theme';
import type { LostReport } from '@/data/lost-reports';
import { shortLink } from '@/lib/lost';
import {
  POSTER_FORMATS,
  posterDescription,
  posterHeading,
  posterLastSeen,
  type PosterFormat,
} from '@/lib/poster';

const TEAR_TABS = 7;
const CUT_LINE = '#C8C7DA';
// Bundan uzun açıklama, tamamı görünen biçimde küçük yazıyla yazılır.
const LONG_DESCRIPTION_CHARS = 250;

// Her biçimin kendi ölçüleri. Sayılar tasarım birimidir, ekrana göre büyür.
const LAYOUT: Record<
  PosterFormat,
  {
    band: number;
    name: number;
    body: number;
    // Boşsa açıklamanın tamamı görünür, fotoğraf küçülür.
    descriptionLines: number | undefined;
    // Tamamı görünen uzun açıklamanın yazı boyu. Yoksa açıklama hep `body` boyunda.
    longDescription: number | undefined;
    qr: number;
    topPadding: number;
    bottomPadding: number;
    // İlanın çevresindeki lacivert çerçeve. Yoksa ilan görselin tamamını kaplar.
    frame: { side: number; safe: number } | undefined;
    // Koparılan şeritlerin boyu. 0 ise şerit yok.
    tear: number;
  }
> = {
  story: {
    band: 42,
    name: 34,
    body: 15,
    descriptionLines: 4,
    longDescription: undefined,
    qr: 96,
    topPadding: 16,
    bottomPadding: 16,
    // Instagram story'nin üstünde ve altında yaklaşık 250 piksel uygulamanın yazı ve düğmeleriyle kapanır.
    // Oraya yazı konmaz. Boş kâğıt gibi görünmesin diye bu pay ilanı saran lacivert çerçeve olur.
    frame: { side: 12, safe: 84 },
    tear: 0,
  },
  post: {
    band: 38,
    name: 25,
    body: 13,
    descriptionLines: 3,
    longDescription: undefined,
    qr: 78,
    topPadding: 14,
    bottomPadding: 14,
    frame: undefined,
    tear: 0,
  },
  a4: {
    band: 44,
    name: 30,
    body: 14,
    descriptionLines: undefined,
    // Kâğıtta yaklaşık 17 punto: uzaktan okunur, en uzun açıklamada da QR kodu şeritlere binmez.
    longDescription: 12,
    qr: 100,
    topPadding: 18,
    bottomPadding: 16,
    frame: undefined,
    tear: 96,
  },
};

// Çıktı görseli tam istenen piksel boyutunda olsun diye ilan gerçek boyutunda çizilir,
// ekrandaki önizleme bunu küçültür. Görsel alınırken netlik kaybı olmaz.
export function posterSize(format: PosterFormat) {
  const { width, height, units } = POSTER_FORMATS[format];
  const ratio = PixelRatio.get();
  return {
    width: width / ratio,
    height: height / ratio,
    unit: width / ratio / units,
  };
}

type LostPosterProps = {
  report: LostReport;
  link: string;
  format: PosterFormat;
  posterRef: Ref<ComponentRef<typeof View>>;
  onPhotoSettled: () => void;
};

export function LostPoster({ report, link, format, posterRef, onPhotoSettled }: LostPosterProps) {
  const { width, height, unit } = posterSize(format);
  const layout = LAYOUT[format];
  const u = (value: number) => value * unit;
  const description = posterDescription(report.breed, report.description);
  const short = shortLink(link);
  const qrSize = u(layout.qr);
  const qrInset = qrQuietInset(link, qrSize);
  const { frame } = layout;
  // Fotoğraf yoksa türün simgesi durur, fotoğrafsız avatarlardaki gibi.
  const SpeciesIcon = SPECIES[report.species]?.Icon ?? PawPrintIcon;
  const descriptionSize =
    layout.longDescription !== undefined && description.length > LONG_DESCRIPTION_CHARS
      ? layout.longDescription
      : layout.body;
  const [hasPhotoFailed, setHasPhotoFailed] = useState(false);

  return (
    <View
      collapsable={false}
      ref={posterRef}
      style={[
        styles.poster,
        { width, height },
        frame && styles.framed,
        frame && {
          paddingHorizontal: u(frame.side),
          paddingVertical: u(frame.safe),
        },
      ]}>
      <View style={[styles.sheet, frame && { borderRadius: u(14) }]}>
        <View
          style={[
            styles.body,
            {
              paddingHorizontal: u(16),
              paddingTop: u(layout.topPadding),
              paddingBottom: u(layout.bottomPadding),
            },
          ]}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[
              styles.band,
              {
                fontSize: u(layout.band),
                lineHeight: u(layout.band * 1.15),
                letterSpacing: u(-1.5),
              },
            ]}>
            {posterHeading(report.species)}
          </Text>

          <View
            style={[styles.photoBox, { marginTop: u(8), borderRadius: u(10), minHeight: u(110) }]}>
            {report.photoUrl && !hasPhotoFailed ? (
              <Image
                accessibilityIgnoresInvertColors
                onError={() => {
                  setHasPhotoFailed(true);
                  onPhotoSettled();
                }}
                onLoadEnd={onPhotoSettled}
                // Hayvanı tanıtan tek şey fotoğraf: kırpılmaz, kenarlarda zemin rengi kalır.
                resizeMode="contain"
                source={{ uri: report.photoUrl }}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <SpeciesIcon size={u(96)} weight="duotone" color={colors.ink} />
            )}
          </View>

          <Text
            numberOfLines={2}
            style={[
              styles.strip,
              {
                marginTop: u(10),
                paddingVertical: u(6),
                paddingHorizontal: u(10),
                borderRadius: u(6),
                fontSize: u(layout.body - 0.5),
                lineHeight: u(layout.body * 1.25),
              },
            ]}>
            {posterLastSeen(report.lastSeenArea, report.lastSeenAt)}
          </Text>

          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[
              styles.name,
              {
                marginTop: u(8),
                fontSize: u(layout.name),
                lineHeight: u(layout.name * 1.2),
                letterSpacing: u(-0.6),
              },
            ]}>
            {report.petName}
          </Text>
          {description !== '' && (
            <Text
              numberOfLines={layout.descriptionLines}
              style={[
                styles.description,
                {
                  marginTop: u(2),
                  fontSize: u(descriptionSize),
                  lineHeight: u(descriptionSize * 1.35),
                },
              ]}>
              {description}
            </Text>
          )}

          <View style={[styles.foot, { marginTop: u(12), gap: u(14) }]}>
            {/* Kodun çevresindeki boş pay beyaz zemine taşar: kodun kendisi fotoğraf ve yazılarla aynı sol çizgide durur. */}
            <View style={{ margin: -qrInset }}>
              <QrCode size={qrSize} value={link} />
            </View>
            <View style={styles.footCopy}>
              <Text
                style={[
                  styles.footTitle,
                  {
                    fontSize: u(layout.body + 1),
                    lineHeight: u(layout.body * 1.3),
                  },
                ]}>
                Gördün mü? QR kodunu okut, ailesine haber ver
              </Text>
              <Text
                style={[
                  styles.footNote,
                  {
                    marginTop: u(2),
                    fontSize: u(layout.body - 1),
                    lineHeight: u(layout.body * 1.25),
                  },
                ]}>
                Uygulama gerekmez
              </Text>
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[styles.footLink, { marginTop: u(2), fontSize: u(layout.body - 1.5) }]}>
                {short}
              </Text>
            </View>
          </View>
        </View>

        {layout.tear > 0 && (
          <View style={[styles.tear, { height: u(layout.tear) }]}>
            <CutLines stroke={Math.max(u(0.8), 1)} dash={u(3)} />
            {Array.from({ length: TEAR_TABS }, (_tab, index) => (
              <View key={index} style={styles.tab}>
                {/* Yazı çizgilere değmesin diye şeridin boyundan kısa. */}
                <View style={[styles.tabLabel, { width: u(layout.tear - 14) }]}>
                  <Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    style={[styles.tabName, { fontSize: u(8) }]}>
                    {report.petName} kayıp
                  </Text>
                  <Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    style={[styles.tabLink, { fontSize: u(7) }]}>
                    {short}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// Kesim çizgileri: üstte bir boydan boya, şeritlerin arasında dikine. Kâğıdın kenarına çizgi gerekmez.
function CutLines({ stroke, dash }: { stroke: number; dash: number }) {
  const line = {
    stroke: CUT_LINE,
    strokeWidth: stroke,
    strokeDasharray: [dash, dash * 0.8],
  };
  return (
    <Svg style={StyleSheet.absoluteFill}>
      <Line x1="0" x2="100%" y1={stroke / 2} y2={stroke / 2} {...line} />
      {Array.from({ length: TEAR_TABS - 1 }, (_line, index) => {
        const x = `${((index + 1) * 100) / TEAR_TABS}%`;
        return <Line key={index} x1={x} x2={x} y1="0" y2="100%" {...line} />;
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  poster: {
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  framed: {
    backgroundColor: colors.ink,
  },
  sheet: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  body: {
    flex: 1,
  },
  band: {
    textAlign: 'center',
    fontFamily: fonts.display,
    color: colors.ink,
  },
  photoBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.sky,
  },
  strip: {
    overflow: 'hidden',
    backgroundColor: colors.alert,
    fontFamily: fonts.uiHeavy,
    color: colors.ink,
  },
  name: {
    fontFamily: fonts.display,
    color: colors.ink,
  },
  description: {
    fontFamily: fonts.uiSemi,
    color: colors.ink2,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footCopy: {
    flex: 1,
    minWidth: 0,
  },
  footTitle: {
    fontFamily: fonts.uiHeavy,
    color: colors.ink,
  },
  footNote: {
    fontFamily: fonts.uiSemi,
    color: colors.ink2,
  },
  footLink: {
    fontFamily: fonts.uiBold,
    color: colors.ink2,
  },
  tear: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    alignItems: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  tabName: {
    fontFamily: fonts.uiHeavy,
    color: colors.ink,
  },
  tabLink: {
    fontFamily: fonts.uiBold,
    color: colors.ink,
  },
});
