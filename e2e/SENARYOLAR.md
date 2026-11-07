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

### Alt menü (taklitçi)
Kayıp düğmesinin başka sekmeden açılması, dairenin menü dışına taşan yerine dokunma, kapatınca sekmenin değişmemesi, Android geri tuşunun Ayarlar'dan Bugün'e dönmesi, açık ilanda düğmenin hayvanın adını gösterip ilanı açması, veteriner menüsünde kayıp düğmesinin olmaması.

### Kayıp modu (taklitçi)
Hayvan fotoğrafının yüklenmesi, yer seçmeden başlatamama, kısa dokunuşun başlatmaması, haritadan yer seçimi, ilan fotoğrafı, canlı ihbar, bildirim, arama düğmesi, ihbar türleri, üç ilan biçimi, QR'ın ekrandan, görselden ve PDF içinden okunması, A4'ün tek sayfa ve sayfayı doldurması, bağlantı kopyalama, Android Chrome'dan ihbar, bulundu (vazgeçme, fotoğrafın silinmesi), QR ekranı, yazdırma ekranı, ilan yokken haber, haberden kayıp modu başlatma.

### Dayanıklılık (taklitçi)
Sunucu kapalıyken kayıt, uyarı ve geri gelince eşitleme, sunucu sonrası canlı bağlantı, oturum düşünce kayıtların kalması ve Bugün'de uyarı kartı, karttan yeniden giriş, kendi isteğiyle çıkışta ve hesap silmede kartın çıkmaması, başka hesapla girişte soru (vazgeç, aktar), yeni telefona kayıt ve fotoğraf gelmesi, çıkış. Hesap silme: açık ilan uyarısı, vazgeçme, sunucu kapalıyken onay sorulmaması, onaydan sonra sunucu giderse telefonda hiçbir şeyin silinmemesi, başarıda sunucu ve telefonun temizlenmesi, QR sayfasının kapanması, başka hesaba dokunulmaması.

### Veteriner ve randevu (taklitçi)
Veteriner hesabı (yanlış şifre, kısa şifre, kayıt, giriş), telefondaki sahip kayıtlarının veteriner hesabına gitmemesi ve çıkışta kalması, işletme formu (eksikler listesi, geçersiz telefon ve web adresi, harita, çalışma saati, tür, hizmet), onay bekleme, onaysız kliniğin listede görünmemesi, kimlik değişince yeniden onay uyarısı. Sahip: ad sırası, konum izniyle yakınlık sırası ve mesafe, klinik sayfası, arama düğmesi, girişsiz randevu istenememesi, kapalı günün seçilememesi, geçersiz telefon, istek, ikinci istekte telefonun hazır gelmesi. Onay: ekranın kendiliğinden değişmesi, ziyarete düşmesi, Bugün kartı. Red ve notu, sahip iptali (ziyaret kalkar), veteriner paneli (sahip bilgileri, arama, reddet, onayla, iptal, geçmiş), veteriner hesabını silme.

### Yönetici kararlarının uygulamadaki karşılığı (taklitçi)
İlan kaldırılınca açık ekranın "İlan kaldırıldı"ya dönmesi, bildirim, kayıp sayfasının kapanması. Hesap kapatılınca oturumun düşmesi, doğru şifreyle bile giriş uyarısı, yeniden açılınca giriş.

### Yönetim paneli (Chrome motoru, masaüstü ve telefon genişliği)
Sunucu: giriş ve çerez kuralları, e-posta başına deneme sınırı, oturumsuz ve uygulama oturumuyla hiçbir ucun çalışmaması, başka siteden gelen isteğin reddi, özet rakamlar, klinik onayı ve reddi, yaklaşan randevuların iptali, ilan kaldırma, ihbar silme, hesap kapatma ve açma, tam konum, sağlık kaydı ve Apple kimliğinin hiçbir uçtan dönmemesi. Tarayıcı: tüm akışlar gerçek sunucuyla, Vazgeç ve Esc, oturum düşmesi, sunucuya ulaşılamaması, kötü niyetli metnin çalışmaması, yatay taşma.

### Sunucu
Giriş ve oturum, Apple belgesi sahteciliği (başka uygulama, başka yayıncı, süresi dolmuş, değiştirilmiş, imzasız), tüm korumalı uçlar, kullanıcılar arası erişim, son değişiklik kazanır, ileri saat, yarım emoji, sayfalama, geçersiz girdiler, fotoğraf sınırları ve klasör atlatma, GPS ve üst verinin silinmesi, kayıp ilanı kuralları, herkese açık alanlar, ihbar sınırları, haberin ilana eklenmesi, hayvan ve hesap silme, canlı bağlantı, ayarlar, güvenlik başlıkları. Veteriner: şifrenin özetle saklanması, rol ayrımı (iki yönlü), klinik onayı ve herkese açık alanlar, geçersiz bilgiler, fotoğraf üst verisi, boş saat hesabı, randevu kuralları ve sınırları, aynı saate çift onay, başka kliniğin randevusuna erişememe, süresi dolan istek, hayvan ve hesap silince randevular.

### Kayıp sayfası (Safari motoru ve Chrome motoru)
Tüm durumlar (kayıp, bulundu, ilan yok, bulunamadı, sunucu hatası), form (boş, konum izni var ve yok, gönderim hatası, çift basış, sınırlar), kötü niyetli metin, dış istek olmaması, yatay taşma, dokunma boyutu, yazı tipleri, sayfa ağırlığı.

### Piksel karşılaştırması
- **Taklitçi:** Karşılama, hayvan ekleme, Bugün (boş, kartlar, görev yapıldı, haber kartı, açık ilan), aşı formu, görev formu, silme onayı, kilo, Hayvanlar, Ayarlar, kayıp ekranı, ilan (üç biçim), QR ekranı, haber ekranı, başka hesap sorusu, hesap silme onayı, oturum kapandı kartı, veteriner girişi, veteriner paneli, işletme formu ve profili, veteriner listesi, klinik sayfası.
- **Kayıp sayfası:** 13 durum, 3 ekran ölçüsünde.
- **Yönetim paneli:** 7 ekran, 2 ekran ölçüsünde (giriş, özet, klinikler, klinik ayrıntısı, onay penceresi, ilanlar, kullanıcılar).

## Kapsanmayanlar

### Yalnızca iPhone'da denenebilir (otomatik test yok)
Bilgisayarda sanal iPhone çalışmıyor, Playwright da iOS'u süremiyor. Safari motoru testleri gerçek Safari yerine geçmez.
- Apple ile giriş ve gerçek Apple belgesi, adın ilk girişte gelmesi
- İlan görselinin iPhone'da üretilmesi (`useRenderInContext` Android'de etkisiz)
- A4 PDF'in iPhone yazıcısında sayfayı doldurması
- `http` ve `ws` ile gerçek ağ üzerinden bağlantı (taklitçi hep `127.0.0.1` kullanıyor)
- Kilit ekranından "Yapıldı" sonrası uygulamanın açılması
- Apple Haritalar, "Konumumu kullan"
- Hesap silmede Apple izni iptali (henüz yazılmadı, Apple geliştirici üyeliği gerekiyor)
- Veteriner ekranlarının ve randevu formunun iPhone'daki görünümü, klavyeyle davranışı
- Alt menüdeki kayıp dairesinin iPhone'daki görünümü ve menü dışına taşan yerine dokunma
- Oturum kapandı kartındaki ve Ayarlar'daki Apple düğmesi (taklitçide bu kartta deneme hesabı düğmesi var)

### Taklitçide yapılamıyor
- **"Konumumu kullan" ile gerçek konum:** Taklitçide Google'ın konum doğruluğu izni gerekiyor, bu izin bilerek verilmedi. Veteriner listesinde Android'in test sağlayıcısı kullanılıyor: sıralama gerçek, konum sahte. Gerçek konum iPhone'da denenecek.
- **Otomatik semt yazısı:** Taklitçide adres servisi çalışmıyor, semt elle yazılıyor.

### Yönetim panelinde sınanmayanlar
- Yalnızca Chrome motorunda denendi, Safari ve Firefox'ta denenmedi
- Yönetici komutunun gizli şifre sorusu terminal taklidiyle denendi, gerçek terminalde denenmedi
- Gerçek HTTPS ve önündeki sunucu arkasında çerez ve adres davranışı (gerçek sunucuya geçince)
- İki yöneticinin aynı anda çalışması

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
- Çalışma saatini saat seçiciyle değiştirme, "İlk günün saatlerini uygula", klinik fotoğrafı seçme ve yükleme
- Randevu bildiriminin ekranda görünmesi ve dokununca doğru ekranın açılması
- Veteriner uygulama açıkken istek gelince listenin değişmesi (sahip tarafında var)
- Piksel karşılığı olmayan ekranlar: kayıp başlatma, bulundu, tedavi ve ziyaret listeleri ve formları, görev listesi, kilo grafiği

## Bilinen ve kabul edilen sınırlar
- Telefonun saati **geride** ise yapılan düzenleme sunucudaki daha "yeni" kaydı ezemez ve sessizce yedeklenmez (son değişiklik kazanır kuralı). Saat **ileride** ise sunucu sınırlıyor.
- Dakikada 10 ihbar sınırı Docker kurulumunda herkes için ortak, çünkü tüm ziyaretçiler tek adres görünüyor. Gerçek sunucuda `TRUST_PROXY` ile düzelir.
- Testler Docker'daki geliştirme veritabanına deneme hesapları açar. Yalnızca `apple_sub` boş olan hesaplara dokunur, Apple ile açılan hesap güvendedir.
