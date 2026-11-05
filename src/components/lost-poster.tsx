import { PawPrintIcon } from 'phosphor-react-native/src/icons/PawPrint';
import { useState, type ComponentRef, type Ref } from 'react';
import { Image, PixelRatio, StyleSheet, Text, View } from 'react-native';

import { QrCode } from '@/components/qr-code';
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

// Her biçimin kendi ölçüleri. Sayılar tasarım birimidir, ekrana göre büyür.
const LAYOUT: Record<
  PosterFormat,
  {
    band: number;
    name: number;
    body: number;
    // Boşsa açıklamanın tamamı görünür, fotoğraf küçülür.
    descriptionLines: number | undefined;
    qr: number;
    topPadding: number;
    bottomPadding: number;
    hasTearTabs: boolean;
  }
> = {
  // Instagram story'de üst ve alt kısım uygulamanın düğmeleriyle kapanıyor, oraya yazı konmaz.
  story: {
    band: 42,
    name: 34,
    body: 15,
    descriptionLines: 8,
    qr: 112,
    topPadding: 64,
    bottomPadding: 84,
    hasTearTabs: false,
  },
  post: {
    band: 38,
    name: 25,
    body: 13,
    descriptionLines: 3,
    qr: 78,
    topPadding: 14,
    bottomPadding: 12,
    hasTearTabs: false,
  },
  a4: {
    band: 44,
    name: 30,
    body: 14,
    descriptionLines: undefined,
    qr: 112,
    topPadding: 18,
    bottomPadding: 14,
    hasTearTabs: true,
  },
};

// Çıktı görseli tam istenen piksel boyutunda olsun diye ilan gerçek boyutunda çizilir,
// ekrandaki önizleme bunu küçültür. Görsel alınırken netlik kaybı olmaz.
export function posterSize(format: PosterFormat) {
  const { width, height, units } = POSTER_FORMATS[format];
  const ratio = PixelRatio.get();
  return { width: width / ratio, height: height / ratio, unit: width / ratio / units };
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
  const [hasPhotoFailed, setHasPhotoFailed] = useState(false);

  return (
    <View collapsable={false} ref={posterRef} style={[styles.poster, { width, height }]}>
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
            { fontSize: u(layout.band), lineHeight: u(layout.band * 1.15), letterSpacing: u(-1.5) },
          ]}>
          {posterHeading(report.species)}
        </Text>

        <View style={[styles.photoBox, { marginTop: u(8), borderRadius: u(10), minHeight: u(110) }]}>
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
            <PawPrintIcon size={u(56)} weight="fill" color={colors.ink} />
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
              { marginTop: u(2), fontSize: u(layout.body), lineHeight: u(layout.body * 1.35) },
            ]}>
            {description}
          </Text>
        )}

        <View style={[styles.foot, { marginTop: u(8), gap: u(10) }]}>
          <QrCode size={u(layout.qr)} value={link} />
          <View style={styles.footCopy}>
            <Text
              style={[
                styles.footTitle,
                { fontSize: u(layout.body + 1), lineHeight: u(layout.body * 1.3) },
              ]}>
              Gördün mü? QR kodunu okut, ailesine haber ver
            </Text>
            <Text
              style={[
                styles.footNote,
                { marginTop: u(2), fontSize: u(layout.body - 1), lineHeight: u(layout.body * 1.25) },
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

      {layout.hasTearTabs && (
        <View style={[styles.tear, { height: u(112) }]}>
          {Array.from({ length: TEAR_TABS }, (_tab, index) => (
            <View
              key={index}
              style={[styles.tab, { borderWidth: Math.max(u(0.6), 1), marginLeft: index ? -1 : 0 }]}>
              <View style={[styles.tabLabel, { width: u(108) }]}>
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
  );
}

const styles = StyleSheet.create({
  poster: {
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
    borderStyle: 'dashed',
    borderColor: '#C8C7DA',
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
