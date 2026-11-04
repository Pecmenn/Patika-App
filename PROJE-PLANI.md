# Patika Proje Planı

Son güncelleme: 5 Kasım 2026

Patika; evcil hayvanların aşı, tedavi ve kilo kayıtlarını tek yerde tutan, zamanı gelince hatırlatan ve hayvan kaybolduğunda ilan ile QR sayfası sunan bir telefon uygulaması. Hedef, portfolyodaki tasarımı App Store'da yayınlanan gerçek bir ürüne dönüştürmek.

## Kararlar

| Konu | Karar | Durum |
|---|---|---|
| Ad | Patika | Kesin |
| App Store adı | Patika: Evcil Hayvan Karnesi | Öneri, Apple'da ad ayırırken doğrulanacak |
| Hedef | Önce App Store, Türkiye | Kesin |
| Dil | Önce Türkçe, İngilizce eklenebilecek şekilde | Kesin |
| Giriş | Apple ile giriş | Kesin |
| İlk sürüm kapsamı | Aşağıdaki liste | Kesin |
| Teknoloji | Expo (React Native), SDK 58 | Kesin |
| Çalışma yeri | Windows bilgisayar, kod `Desktop\Patika-App` klasöründe | Kesin |
| Alan adı | patika.pet | Öneri, satın alınmadı, boş olduğu doğrulanmadı |
| Sunucu | Henüz seçilmedi | Açık |

## İlk sürüm: tasarımdan gelen 11 ekran

Tasarımdaki adlar `screens.html` içindeki `data-screen` değerleridir.

| Ekran | Tasarımdaki adı | İlk sürümde nasıl çalışacak |
|---|---|---|
| Karşılama | `welcome` | Apple ile girişe götürür |
| Hayvan ekleme | `add-pet` | Ad, tür, ırk, fotoğraf, doğum tarihi veya yaklaşık yaş |
| Bugün | `home` | Yaklaşan aşılar ve günün görevleri, kayıp modu düğmesi. Randevu düğmesi yok |
| Sağlık kaydı | `records` | Kayıtlar elle girilir ve "Elle girildi" yazar. Tarama ve randevu düğmesi yok |
| Kilo | `weight` | Kayıt ve grafik. Sağlıklı aralık yalnızca kullanıcı girerse görünür |
| Hatırlatmalar | `lock-daily` | Bildirim ve "Verildi" ile "1 saat sonra" seçenekleri. Widget yok |
| Kayıp modu başlatma | `start-lost` | Basılı tutarak başlar. Listede yalnızca gerçekten olacak şeyler yazar |
| Arama | `lost` | Harita, ihbarlar, ilanı paylaşma, bulundu. Komşu sayısı ve arama düğmesi yok |
| İlan | `poster` | Story, gönderi ve A4 biçimleri, QR ve bağlantı. Telefon numarası yok |
| QR sayfası | `finder` | Uygulama gerektirmeyen web sayfası. Bulan kişi konum ve mesaj gönderir |
| Bulundu | `found` | Kayıp modu kapanır, süre ve ihbar sayısı görünür. Randevu önerisi yok |

## İlk sürüm: tasarımda olmayan, eklenmesi gereken ekranlar

Bu ekranlar yeni özellik değil, onaylanan özelliklerin çalışması için gerekli. Mevcut görsel dille tasarlanacak.

- Apple ile giriş
- Aşı, tedavi ve ziyaret kaydı ekleme formu (tarama olmadığı için şart)
- Kilo ekleme formu
- Görev ve hatırlatma ekleme formu
- Hayvanlar listesi (alt menüdeki sekme için)
- Sağlık kaydının Tedaviler ve Ziyaretler bölümleri
- Ayarlar ve hesap silme (Apple, hesap açılan uygulamalarda hesap silmeyi uygulama içinde ister)
- QR sayfasındaki konum ve mesaj gönderme formu
- Yazdırılabilir QR kodu ekranı

Alt menüde Ziyaretler sekmesi kalkar; ziyaret kayıtları sağlık kaydının içinde durur.

## Sonraya kalanlar

| Özellik | Tasarımdaki adı | Neden sonra |
|---|---|---|
| Karne tarama | `scan` | İlk güncellemede. Ücretli yapay zekâ gerektiriyor, yanlış tarih sağlık riski yaratır |
| Veteriner bulma ve randevu | `find-vet`, `book` | Kliniklerin katılması gerekiyor |
| Kilit ekranı canlı kartı | `lock-lost` | Temel akış oturduktan sonra |
| Kilit ekranı widget'ları | `lock-daily` içinde | Temel akış oturduktan sonra |
| 2 km komşu alarmı | | Yeterli kullanıcı gerekiyor |
| Klinik mührü, veteriner ve barınak bildirimi | | Kliniklerin katılması gerekiyor |
| Numarası gizli arama | | Ücretli arama servisi gerekiyor |
| Fiziksel künye | | Fiziksel ürün, ilk sürümde QR yazdırılır |
| Android | | Expo seçilirse aynı koddan eklenebilir |

## Açık işler

- [ ] TürkPatent'te "Patika" markasını kontrol et (9, 42 ve 44. sınıflar): https://www.turkpatent.gov.tr/arastirma-yap?form=trademark
- [ ] Kontrol temizse patika.pet alan adını satın al
- [ ] Apple geliştirici üyeliğini aç (Apple ile giriş adımında gerekecek, 99 dolar/yıl, TL fiyatı doğrulanmadı)
- [ ] Sunucu servisini seç
- [ ] Gizlilik politikası ve KVKK metnini hazırla
- [ ] Expo'nun widget sınırlamalarını kontrol et (widget aşamasında)
- [ ] Karşılama ekranındaki kedi ve köpek fotoğraflarının App Store'da kullanım hakkını kontrol et
- [ ] Karşılama ekranındaki düğmeleri bağla (hayvan ekleme ve Apple ile giriş hazır olunca)

## Yol haritası

1. İsim ve marka kontrolü
2. Kurulum ve boş uygulamayı iPhone'da açma (tamamlandı, SDK 58 App Store'daki Expo Go ile açıldı)
3. Günlük bakım ekranları ve hatırlatmalar (başladı: Karşılama ekranı kodlandı)
4. Hesap sistemi, sunucu, kayıp ilanı ve QR sayfası
5. TestFlight (Apple'ın deneme aracı) ile gerçek kişilerle test
6. App Store başvurusu ve Apple incelemesi

## Test ve derleme

- **Şimdilik:** Kod Windows'ta yazılıyor. Sonuç iPhone'da Expo Go uygulamasıyla, tarayıcıda da web önizlemesiyle görülüyor. Windows'ta sanal iPhone çalışmıyor.
- **Sonra:** Expo Go sınırlı bir deneme aracı. Ek yerel modül (uygulamanın telefon özelliklerine bağlanan parçası) gerektiğinde uygulamanın kendi geliştirme sürümü derlenecek. Bunun iPhone'da çalışması için Apple geliştirici üyeliği gerekecek.
- **Yayın:** Derleme ve App Store'a gönderim EAS (Expo'nun bulut servisi) ile yapılabiliyor, Mac şart değil. EAS ücretlerine henüz bakılmadı.

**Bu projede öğrenilenler:**

- Git'te ana hatta (`master`) çalışılıyor, kullanıcı böyle seçti.
- Windows'ta `npx expo login` tarayıcı açarken hata verip kapanıyor. Girişte `npx expo login --no-browser` kullan.
- Yeni paket kurulunca sunucu dosyaları göremeyebilir. `npx expo start --clear` ile yeniden başlat.
- Web önizlemesi için `app.json` içinde `web.output` değeri `single`. `server` değeri ekran genişliğini 0 sayıp sayfayı bozuyordu. QR sayfası aşamasında bu ayar yeniden değerlendirilecek.
- İkon paketi çok büyük. İkonları tek tek al: `phosphor-react-native/src/icons/Check`.

## Pazar bilgisi (5 Kasım 2026'da kontrol edildi)

Türkiye'de telefonların yaklaşık %74'ü Android, %26'sı iPhone (StatCounter, Temmuz 2026).

App Store'daki benzer adlı uygulamalar:

- [Patika: Kayıp & Sahiplendirme](https://apps.apple.com/tr/app/patika-kay%C4%B1p-sahiplendirme/id6802413561): en yakın rakip. Ağustos 2026'da çıktı, düzenli güncelleniyor. Mağaza metni kayıp ilanı, QR kimlik, aşı hatırlatma ve dijital karneden söz ediyor.
- [Patika: Pet Companion](https://apps.apple.com/tr/app/patika-pet-companion/id6767281390): aşı, ilaç ve mama takibi. Mayıs 2026.
- [Patika Pet](https://apps.apple.com/us/app/patika-pet/id6762758279): evcil hayvan sosyal ağı. Nisan 2026.

Uygulamalar denenmedi, yalnızca mağaza metinleri okundu.

## Tasarım kaynakları

Hepsi `C:\Users\user\Desktop\Portfolyolar\Behance\Patika` klasöründe:

- `screens.html` ve `styles.css`: tüm ekranlar ve görsel kurallar
- `case-study.html`: ürün hikâyesi, akışlar ve bileşenler
- `export/screens/`: ekran görselleri
- `img/`: fotoğraflar

**Renkler:** Tasma mavisi `#1D2452` (metin, ana düğmeler), Tenis topu `#D9F26B` (tamamlandı, yaklaşıyor, bulundu), Pati pembesi `#F7BACB`, Lavanta `#BDD0FF`, Kâğıt `#F3F2FA` (arka plan), Fosforlu `#FF4F1A` (yalnızca kayıp modu).

**Yazı tipleri:** Unbounded (başlıklar ve sayılar), Figtree (arayüz metni). **İkonlar:** Phosphor.
