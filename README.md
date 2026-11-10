# Patika

Evcil hayvanların aşı, tedavi, ziyaret ve kilo kayıtlarını tek yerde tutan, zamanı gelince hatırlatan, hayvan kaybolduğunda ilan ve QR sayfası sunan telefon uygulaması. Veterinerler klinik profili açıp randevu isteklerini yönetebilir.

Geliştirme aşamasında, App Store'da henüz yok. Sunucu da henüz internette değil, yalnızca kendi bilgisayarında çalışıyor.

**Teknoloji:** Expo SDK 58 (React Native), Expo Router, TypeScript. Sunucusu ayrı depoda: [Patika-Backend](https://github.com/Pecmenn/Patika-Backend).

## Çalıştırma

Gerekenler:

- Node.js 24
- Telefonda Expo Go uygulaması (SDK 58 sürümü)
- Telefon ile bilgisayar aynı Wi-Fi ağında
- Giriş, yedekleme, kayıp ilanı ve veteriner ekranları için çalışan bir [Patika-Backend](https://github.com/Pecmenn/Patika-Backend). Kurulumu o deponun README dosyasında. Sunucu olmadan uygulama açılır, kayıtlar yalnızca telefonda kalır.

```bash
npm install
npx expo start
```

Ekrana gelen QR kodunu iPhone'da kamerayla, Android'de Expo Go ile okut.

Uygulama sunucuyu kendisi bulur: kodu sunan bilgisayarın 4000 numaralı kapısına bağlanır. Bu yüzden sunucuyu ve `npx expo start` komutunu aynı bilgisayarda çalıştır. Geliştirirken ayar dosyası gerekmez. Başka bir sunucuya bağlanmak için `.env.example` dosyasını `.env` adıyla kopyalayıp `EXPO_PUBLIC_API_URL` değerini yaz. `.env` Git'e girmez.

**Giriş:** Sahip girişi Apple ile yapılır. Denemek için Karşılama ekranında ve Ayarlar'da "Deneme hesabıyla gir" düğmesi var. Bu düğme yalnızca sunucunun `.env` dosyasında `ALLOW_DEV_LOGIN=true` iken çalışır. Her basış yeni, boş bir hesap açar. Veteriner girişi Karşılama'daki ayrı düğmeden, e-posta ve şifreyle.

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npx expo start` | Geliştirme sunucusunu başlatır |
| `npm test` | Tarih, görev, kilo, eşitleme, QR ve klinik kuralları |
| `npm run test:e2e` | Android taklitçisinde gerçek ekranlar ve piksel testleri (Playwright) |
| `npx expo lint` | Kod denetimi |
| `npx tsc --noEmit` | Tip kontrolü |

Uçtan uca testler `patika` adlı bir Android taklitçisi ve çalışan sunucu ister. Ayrıntılar `PROJE-PLANI.md` içindeki "Test ve derleme" bölümünde.

## Klasörler

```
src/
  app/          Ekranlar (Expo Router: her dosya bir ekran)
  components/   Ekranlarda kullanılan parçalar
  constants/    Renkler, yazı tipleri, hayvan türleri
  data/         Kayıtların okunup yazılması
  hooks/        Ortak React kancaları
  lib/          Hesaplar ve kurallar (testleri tests/ içinde)
e2e/            Taklitçi testleri, senaryo listesi (SENARYOLAR.md)
```

## Belgeler

- `PROJE-PLANI.md`: kararlar, ilk sürümün kapsamı, açık işler ve ilerleme
- `e2e/SENARYOLAR.md`: test edilen senaryolar ve kapsanmayanlar
- `AGENTS.md`: Expo ile çalışma kuralları
