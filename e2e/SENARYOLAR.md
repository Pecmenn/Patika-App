# Patika test senaryoları

"Olası her senaryo" kelimesi kelimesine mümkün değil. Bu dosya neyin sınandığını ve neyin **sınanmadığını** açıkça tutar. Yeni test ya da bilinen boşluk buraya yazılır.

## Nasıl çalıştırılır

| Komut | Nerede | Ne sınar |
|---|---|---|
| `npm test` | Patika-App | Tarih, görev, kilo, eşitleme, QR ve ilan kuralları |
| `npm run test:e2e` | Patika-App | Taklitçide Playwright ile gerçek ekranlar, gerçek backend, piksel karşılaştırması. Yazdırma sayfaları için gerçek tarayıcı |
| `npm test` | Patika-Backend | Sunucu uçları, erişim kuralları, gerçek MySQL (ayrı test veritabanı) |
| `npm run test:page` | Patika-Backend | Kayıp sayfası: Safari motoru (iki iPhone ölçüsü) ve Chrome motoru, piksel karşılaştırması |

Önce: taklitçi açık, `npx expo start` çalışıyor, `docker compose up -d --build` yapılmış. Testler Docker'daki sayfa koddan eskiyse başlamaz.

**Piksel görselleri:** Bilerek yapılan tasarım değişikliğinden sonra `--update-snapshots` ile yenilenir. Yenilemeden önce görsellere bakılmalı: Bu bayrakla çalışan test hiçbir şey karşılaştırmaz.

## Kapsanan senaryolar

### Günlük bakım (taklitçi)
Temiz kurulum, ad yazmadan kaydedememe, hayvan ekleme, aşı (boş ad, öneri, sonraki tarih, düzenleme), tedavi (not, silme onayı, vazgeçme), ziyaret, kilo (geçersiz değer, ekleme), görev ve "Yapıldı", Hayvanlar, ikinci hayvan, hayvan silme. Girişte kayıtların hesaba aktarılıp sunucuya eksiksiz gitmesi, silinenin sunucuda "silindi" olması.

### Kayıp modu (taklitçi)
Hayvan fotoğrafının yüklenmesi, yer seçmeden başlatamama, kısa dokunuşun başlatmaması, haritadan yer seçimi, ilan fotoğrafı, canlı ihbar, bildirim, arama düğmesi, ihbar türleri, üç ilan biçimi, QR'ın ekrandan, görselden ve PDF içinden okunması, A4'ün tek sayfa ve sayfayı doldurması, bağlantı kopyalama, Android Chrome'dan ihbar, bulundu (vazgeçme, fotoğrafın silinmesi), QR ekranı, yazdırma ekranı, ilan yokken haber, haberden kayıp modu başlatma.

### Dayanıklılık (taklitçi)
Sunucu kapalıyken kayıt, uyarı ve geri gelince eşitleme, sunucu sonrası canlı bağlantı, oturum düşünce kayıtların kalması, başka hesapla girişte soru (vazgeç, aktar), yeni telefona kayıt ve fotoğraf gelmesi, çıkış.

### Sunucu
Giriş ve oturum, Apple belgesi sahteciliği (başka uygulama, başka yayıncı, süresi dolmuş, değiştirilmiş, imzasız), tüm korumalı uçlar, kullanıcılar arası erişim, son değişiklik kazanır, ileri saat, yarım emoji, sayfalama, geçersiz girdiler, fotoğraf sınırları ve klasör atlatma, GPS ve üst verinin silinmesi, kayıp ilanı kuralları, herkese açık alanlar, ihbar sınırları, haberin ilana eklenmesi, hayvan ve hesap silme, canlı bağlantı, ayarlar, güvenlik başlıkları.

### Kayıp sayfası (Safari motoru ve Chrome motoru)
Tüm durumlar (kayıp, bulundu, ilan yok, bulunamadı, sunucu hatası), form (boş, konum izni var ve yok, gönderim hatası, çift basış, sınırlar), kötü niyetli metin, dış istek olmaması, yatay taşma, dokunma boyutu, yazı tipleri, sayfa ağırlığı.

### Piksel karşılaştırması
- **Taklitçi:** Karşılama, hayvan ekleme, Bugün (boş, kartlar, görev yapıldı, haber kartı), aşı formu, görev formu, silme onayı, kilo, Hayvanlar, Ayarlar, kayıp ekranı, ilan (üç biçim), QR ekranı, haber ekranı, başka hesap sorusu.
- **Kayıp sayfası:** 13 durum, 3 ekran ölçüsünde.

## Kapsanmayanlar

### Yalnızca iPhone'da denenebilir (otomatik test yok)
Bilgisayarda sanal iPhone çalışmıyor, Playwright da iOS'u süremiyor. Safari motoru testleri gerçek Safari yerine geçmez.
- Apple ile giriş ve gerçek Apple belgesi, adın ilk girişte gelmesi
- İlan görselinin iPhone'da üretilmesi (`useRenderInContext` Android'de etkisiz)
- A4 PDF'in iPhone yazıcısında sayfayı doldurması
- `http` ve `ws` ile gerçek ağ üzerinden bağlantı (taklitçi hep `127.0.0.1` kullanıyor)
- Kilit ekranından "Yapıldı" sonrası uygulamanın açılması
- Apple Haritalar, "Konumumu kullan"

### Taklitçide yapılamıyor
- **"Konumumu kullan":** Taklitçide Google'ın konum doğruluğu izni gerekiyor, bu izin bilerek verilmedi. iPhone'da denenecek.
- **Otomatik semt yazısı:** Taklitçide adres servisi çalışmıyor, semt elle yazılıyor.

### Henüz yazılmadı
- Hatırlatma bildiriminin zamanında düşmesi, "Yapıldı" ve "1 saat sonra" düğmeleri, uygulama kapalıyken davranış (elle denendi, otomatik testi yok)
- Bildirime dokununca ilgili ekranın açılması
- Tüm görevler ekranı, görev, ziyaret ve kilo düzenleme, sağlıklı aralık
- Tarih ve saat seçicileri, doğum tarihi ve yaklaşık yaş
- Yaklaşan aşı kartı, süresi geçmiş kayıt, 2 ve daha fazla kilo kaydı grafiği
- Aynı hesapla gerçek iki telefon ve çakışma birleştirme
- Gönderilmemiş değişiklikle çıkış uyarısı ("Yine de çık")
- Haritadaki ihbar işaretleri, "haritada aç", iki açık ilan
- Fotoğrafsız ve uzun yazılı ilan görselleri
- Fotoğraf yükleme hatası ve ilan ekranındaki yeniden deneme, fotoğrafsız ilan uyarısı
- `server.ts` başlangıcı, yarım kalan veritabanı değişikliği, yeniden başlatmada veri kalıcılığı, Apple anahtar servisine ulaşılamaması
- Küçük telefon ve büyük yazı boyutu (uygulamada; kayıp sayfasında var)
- Piksel karşılığı olmayan ekranlar: kayıp başlatma, bulundu, tedavi ve ziyaret listeleri ve formları, görev listesi, kilo grafiği

## Bilinen ve kabul edilen sınırlar
- Telefonun saati **geride** ise yapılan düzenleme sunucudaki daha "yeni" kaydı ezemez ve sessizce yedeklenmez (son değişiklik kazanır kuralı). Saat **ileride** ise sunucu sınırlıyor.
- Dakikada 10 ihbar sınırı Docker kurulumunda herkes için ortak, çünkü tüm ziyaretçiler tek adres görünüyor. Gerçek sunucuda `TRUST_PROXY` ile düzelir.
- Testler Docker'daki geliştirme veritabanına deneme hesapları açar. Yalnızca `apple_sub` boş olan hesaplara dokunur, Apple ile açılan hesap güvendedir.
