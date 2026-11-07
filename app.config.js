const { withAndroidManifest, withAppBuildGradle } = require('expo/config-plugins');

// Telefonda denemek için APK ayarları. PATIKA_TEST_APK verilmezse hiçbir şey değişmez:
// Expo Go ve mağaza sürümü yalnızca app.json ile çalışır. Komutlar: PROJE-PLANI.md, Test ve derleme.
module.exports = ({ config }) => {
  if (process.env.PATIKA_TEST_APK !== 'true') {
    return config;
  }
  const withTestSettings = {
    ...config,
    android: {
      ...config.android,
      // Mağaza kimliği değil, geçici. Gerçek kimlik Android sürümünde seçilecek.
      package: 'pet.patika.deneme',
      // Anahtar yoksa harita açılırken uygulama kapanır. Geçersiz anahtarla gri zemin görünür, dokunma çalışır.
      config: { googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY || 'anahtar-yok' } },
    },
  };
  const withCleartext = withAndroidManifest(withTestSettings, (next) => {
    // Sunucu şimdilik şifresiz http. Android bunu ancak açıkça izin verilirse kabul eder.
    next.modResults.manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
    return next;
  });
  return withAppBuildGradle(withCleartext, (next) => {
    // Windows yol sınırı: C++ ara dosyalarının yolu 260 karakteri geçince derleme durur, CMake kısaltsın.
    next.modResults.contents = next.modResults.contents.replace(
      /defaultConfig\s*\{/,
      (match) => `${match}\n        externalNativeBuild { cmake { arguments "-DCMAKE_OBJECT_PATH_MAX=240" } }`,
    );
    return next;
  });
};
