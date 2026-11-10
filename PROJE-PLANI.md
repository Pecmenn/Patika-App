# Patika Proje Planı

Son güncelleme: 9 Kasım 2026

Patika; evcil hayvanların aşı, tedavi ve kilo kayıtlarını tek yerde tutan, zamanı gelince hatırlatan ve hayvan kaybolduğunda ilan ile QR sayfası sunan bir telefon uygulaması. Hedef, portfolyodaki tasarımı App Store'da yayınlanan gerçek bir ürüne dönüştürmek.

## Kararlar

| Konu | Karar | Durum |
|---|---|---|
| Ad | Patika | Kesin |
| App Store adı | Patika: Evcil Hayvan Karnesi | Öneri, Apple'da ad ayırırken doğrulanacak |
| Hedef | Önce App Store, Türkiye | Kesin |
| Dil | Önce Türkçe, İngilizce eklenebilecek şekilde | Kesin |
| Giriş | İki giriş var. Sahip: Apple ile giriş, yeni ve eski kullanıcı aynı düğmeyi kullanır, Android ve tarayıcıda şimdilik girişsiz denenir. Veteriner: e-posta ve şifre, Karşılama'daki ayrı düğmeden. Bir hesap tek rol taşır | Kesin |
| İlk sürüm kapsamı | Aşağıdaki liste | Kesin |
| Teknoloji | Expo (React Native), SDK 58 | Kesin |
| Çalışma yeri | Windows bilgisayar. Uygulama `Desktop\Patika-App`, sunucu `Desktop\Patika-Backend` klasöründe (ayrı repolar) | Kesin |
| Alan adı | patika.pet | Öneri, satın alınmadı, boş olduğu doğrulanmadı |
| Veri saklama | Telefon önce: kayıt önce telefona yazılır (AsyncStorage), internet olunca kendi sunucumuza gider. Çakışmada son değişiklik kazanır. Çıkış yapınca telefondaki kopya silinir, gönderilmemiş değişiklik varsa önce uyarır | Kesin |
| Tedavi kaydı | Aşı gibi: ad, tarih, isteğe bağlı sonraki tarih ve not. Sonraki tarih 7 gün önce ve son gün hatırlatılır. Her gün verilecek ilaç Görevler'e girer | Kesin |
| Ziyaret kaydı | Neden, tarih, isteğe bağlı saat, klinik ve not. Geçmiş ve yaklaşan olabilir. Yaklaşan ziyaret bir gün önce 09.00'da ve o gün (saat varsa 2 saat önce, yoksa 09.00'da) hatırlatılır. Kullanıcı kendisi yazabilir, Patika'dan alınan randevu onaylanınca kendiliğinden düşer | Kesin |
| Kilo kaydı | Kilo, tarih ve not. Sağlıklı aralığı uygulama önermez, kullanıcı veterinerinden öğrendiğini yazar. Bugün'deki kart en son tartılan hayvanı gösterir | Kesin |
| Kayıp sayfası gizliliği | Herkese açık sayfada yalnızca ad, fotoğraf, açıklama ve semt yazısı görünür. Tam konum, sahip ve ihbarlar görünmez. Bulununca yalnızca ad ve durum kalır, herkese açık fotoğraf silinir | Kesin |
| İhbar | Bulan kişi konum, mesaj ve isteğe bağlı iletişim bilgisi gönderir, fotoğraf yok. Hepsini ilanın sahibi görür, denetim için panel yöneticisi de görür (tam konum hariç). Bir ilana saatte en fazla 30, toplam 500 ihbar | Kesin |
| Harita | `react-native-maps`: iPhone'da Apple Haritalar (anahtar gerekmez), Android'de Google Haritalar (mağaza sürümü için anahtar gerekir) | Kesin |
| Görev tekrarı | Bir kez, her gün, her hafta, her ay; isteğe bağlı bitiş tarihi. Günde iki doz iki ayrı görevdir | Kesin |
| Tamamlama düğmesi | Her yerde "Yapıldı" | Kesin |
| Görev hatırlatmaları | Bildirimler önceden tek tek kurulur (günlük 14, haftalık 28, aylık 62 gün). Uygulama açılınca süre uzar, bitmek üzereyken "Patika'yı aç" uyarısı gider. Saatinden önce "Yapıldı" denirse o bildirim iptal olur | Kesin |
| Sunucu | Kendi backend'imiz: Node.js, TypeScript (Fastify), MySQL 8.4, Docker. Supabase'in yerini aldı (5 Kasım 2026, kullanıcı kararı; dil ve mimari kararı Claude'a bırakıldı). Şimdilik yalnızca bu bilgisayarda çalışıyor, uygulama aynı ağdan bağlanıyor | Kesin |
| Sunucunun gerçek yeri | TestFlight'tan önce internete açık bir sunucuya alınacak. Türkiye'de sunucu KVKK yurt dışı aktarım yükümlülüğünü ortadan kaldırabilir, avukata doğrulatılacak | Açık |
| Kayıp sayfasının adresi | Backend'in kendisinden yayınlanıyor: `/p/<kod>`. Basılmış QR değiştirilemez, gerçek kişiler QR basmadan önce kalıcı alan adı şart. Cloudflare denemesi bu karar yüzünden bırakıldı | Kesin |
| QR sayfasında konum | "Konumumu ekle" düğmesi ve yazıyla yer adı. Harita yok, sayfa hızlı açılır. Yazıyla gelen ihbar haritada değil listede görünür | Kesin |
| İlan yokken QR okutulursa | Sayfa "kayıp bildirilmemiş, haber ver" der, form açık. Haber sahibine Bugün'de kart olarak düşer, kayıp modu başlarsa ilana eklenir. Bulunan hayvanda form bağlantının arkasında | Kesin |
| İlan paylaşımı | Story ve gönderi resim, A4 tek sayfalık PDF. Telefonun kendi paylaşım menüsü ve "Bağlantıyı kopyala". Tasarımdaki uygulama düğmeleri yok | Kesin |
| Alt menü | Sahipte Bugün, Hayvanlar, Hayvanım kayıp, Veterinerler, Ayarlar. Veterinerde Randevular, İşletme, Ayarlar. Kayıp düğmesi ortada, turuncu ve menünün üstüne taşar. Sekme değildir: her sekmeden kayıp ekranını açar, açık ilan varsa hayvanın adını gösterip ilanı açar (7 Kasım 2026, kullanıcı isteği) | Kesin |
| Arayüz cilası | App Store'dan önce arayüz dünya standardına çıkarılıyor (8 Kasım 2026, kullanıcı isteği). Sıra: his ve tepki, erişilebilirlik, sonra görsel kalite. Dokunulan her şey aynı biçimde tepki verir, önemli anlarda titreşim olur, telefondaki "hareketi azalt" ayarına uyulur. Yarım form sorulmadan kaybolmaz. Sunucu bekleyen ekranlarda yükleniyor görünümü, "Tekrar dene" ve aşağı çekerek yenileme var. İkincil gri yazı #64688D (tasarımdaki #6E7296 kâğıt zeminde okunabilirlik eşiğinin altındaydı). Silme düğmeleri kırmızı #B42318, çünkü turuncu yalnızca kayıp modunun. Her ekranda tek sol çizgi: bölüm başlıkları, açıklamalar ve yazı bağlantıları kartların kenarıyla hizalı. Sekme başlıkları her sekmede aynı yükseklikte. Açılış ekranı kâğıt zeminde, ortada tasarımdaki Patika simgesi (lacivert kare içinde tasma künyesi). Ad yazılmadı, çünkü Android görseli daireye kırpıyor ve ad hemen sonraki ekranda görünüyor. Fotoğrafı olmayan hayvanın avatarında, türün renginde dairede adın baş harfi durur (Unbounded): aynı türden iki hayvan ayrılır. Harfle başlamayan adda türün simgesi kalır. İlan görselinde QR kodu fotoğraf ve yazılarla aynı sol çizgide durur. Story'de Instagram'ın kapattığı üst ve alt pay (yaklaşık 250 piksel) boş beyaz yerine ilanı saran lacivert çerçevedir. A4'te uzun açıklama (250 karakterden uzun) küçük yazıyla (kâğıtta yaklaşık 17 punto) yazılır, tamamı görünür ve şeritlere binmez. Açıklama Story'de ve gönderide sığmazsa ekranda not çıkar | Kesin |
| Hatırlatma düğmesi | Ayarlar'daki Bildirimler kutusunda "Hatırlatmalar" açma kapama düğmesi, alt yazısız (8 Kasım 2026, kullanıcı isteği). Kapatınca kurulu bütün hatırlatmalar silinir, yenisi kurulmaz, kayıt eklerken izin sorulmaz, Bugün'deki izin kartı çıkmaz. Açarken izin sorulur, reddedilmişse telefon ayarlarına yönlendirilir. Telefonun ayarıdır, hesaba bağlı değil, çıkışta silinmez. Varsayılan açık. Kayıp ihbarı bildirimleri bu düğmeye bağlı değil | Kesin |
| Boş görünen ekranlar | Yalnızca uygulamada zaten olan bilgiyle doldurulur (8 Kasım 2026, kullanıcı kararı). Bugün'de kilo ya da ziyaret yoksa yerinde kesik kenarlı "Kilo ekle" ve "Ziyaret ekle" kartı durur; birden fazla hayvan varsa form önce "Kim için?" diye sorar. Hayvanlar listesinde ve hayvanın sayfasında yaş, son kilo ve sıradaki aşı ya da ziyaret görünür. Ayarlar gruplu liste: Hesap, Bildirimler, Hakkında (sürüm), Oturum. Klinik kartında en çok iki hizmet (hizmet seçilmemişse baktığı türler) ve "Randevu al" aynı sırada | Kesin |
| Basılı tutma düğmesi | 1 saniyede dolar, "Şimdi bırak" yazar, iş parmak kalkınca başlar. Doluyken parmak düğmeden kayarsa da başlar | Kesin |
| Başka hesapla giriş | Telefondaki kayıtlar başka hesaba aitse sorulur: bu hesaba aktar, sil ya da vazgeç. Sorulmadan hiçbir şey silinmez | Kesin |
| İlan fotoğrafı | Sunucu GPS ve diğer üst verileri siler. İlan görselinde fotoğraf kırpılmaz, kenarda zemin rengi kalır. Fotoğraf yoksa türün simgesi durur | Kesin |
| Veteriner onayı | Kayıt olan klinik, sicil bilgisi kontrol edilip panelden onaylanınca listeye girer. Panel açıkken bilgi değiştiyse onay reddedilir. Onaydan sonra klinik adı, hekim adı ya da sicil numarası değişirse yeniden onaya gider | Kesin |
| Panelde ilan kaldırma | Kayıp sayfası kapanır, herkese açık fotoğraf silinir, sahibin açık uygulamasına haber gider, uygulamada "İlan kaldırıldı" görünür. Geri alınamaz, sahibi yeni ilan açabilir. İhbar tek tek de silinebilir | Kesin |
| Panelde hesap kapatma | Silme değil, geri alınabilir. Oturum düşer, giriş yapılamaz, QR sayfası kapanır, açık ilan kalkar, klinik reddedilir, yaklaşan randevular iptal olur. Yeniden açılınca ilan ve klinik onayı kendiliğinden geri gelmez | Kesin |
| Klinik bilgileri | Ad, hekim, oda sicil no (herkese görünmez), telefon, adres, harita konumu, çalışma saatleri, baktığı türler, hizmetler, açıklama, fotoğraf, web, Instagram, randevu aralığı. Yıldız puanı yok | Kesin |
| Veteriner listesi | Alt menüde sekme. Yakınlığa göre sıralanır, konum izni yoksa ad sırası. Konum telefondan çıkmaz: liste indirilir, sıralama telefonda yapılır | Kesin |
| Randevu | İstek ve onay. Sahip çalışma saatlerinden gün ve saat seçer, veteriner onaylar ya da reddeder. Onaylanan randevu sahibin ziyaretlerine düşer, hatırlatmalar çalışır. İki taraf da iptal edebilir | Kesin |
| Randevuda paylaşılan | Sahibin adı ve telefonu, hayvanın adı, türü, ırkı, yaşı, neden ve not. Sağlık kayıtları paylaşılmaz | Kesin |
| Hesap silme | Ayarlar'da düğme, tek onay penceresi. Açık ilan varsa hayvanın adıyla uyarır. Sunucu onaylamadan telefondaki hiçbir şey silinmez, sunucuya ulaşılamıyorsa onay sorulmaz. Silinince QR sayfaları da kapanır | Kesin |
| Backoffice paneli | Yönetim ekranı, `Patika-Backend` içinde, sunucunun `/admin` adresinden tarayıcıyla açılır. İlk sürümde klinik onayı, özet rakamlar, kayıp ilanı denetimi ve kullanıcı yönetimi | Kesin |
| Panele giriş | E-posta ve şifre. Kayıt düğmesi yok, hesap komutla açılır. Bu bilgisayardaki deneme hesabını Claude rastgele şifreyle açtı (7 Kasım 2026, kullanıcı isteği). Gerçek sunucuda hesabı kullanıcı açar, şifreyi kendisi yazar | Kesin |
| Panelde gizlilik | Sağlık kayıtları panelde hiç görünmez. İhbarları ilan sahibinden başka yalnızca yönetici denetim için görür | Kesin |
| Deneme APK'sı | Android telefonda hızlı deneme için, mağaza sürümü değil. Geçici kimlik `pet.patika.deneme`, deneme imzası, kod telefonun içinde. Sunucu bu bilgisayarda: telefon aynı ağda olmalı. Harita anahtarı yok, zemin gri. Sahip girişi "Deneme hesabıyla gir" | Kesin |
| iPhone testleri | Topluca sona bırakıldı (6 Kasım 2026, kullanıcı kararı). İşler bitince kullanıcı Mac'te test ettirecek. O zamana kadar iş başına iPhone denemesi istenmez | Kesin |
| Oturum düşünce | Sunucu oturumu reddederse Bugün'de kart ve giriş düğmesi çıkar, Ayarlar'da da düğme var. Ekran zorla değişmez, yarım form kaybolmaz. Kayıtlar telefonda kalır, girince yedekleme sürer. Kendi isteğiyle çıkışta ve hesap silmede kart çıkmaz | Kesin |

## İlk sürüm: tasarımdan gelen 13 ekran

Tasarımdaki adlar `screens.html` içindeki `data-screen` değerleridir.

| Ekran | Tasarımdaki adı | İlk sürümde nasıl çalışacak |
|---|---|---|
| Karşılama | `welcome` | Apple ile girişe götürür |
| Hayvan ekleme | `add-pet` | Tek adım. Ad ve tür zorunlu; ırk (serbest metin), fotoğraf, doğum tarihi veya yaklaşık yaş isteğe bağlı |
| Bugün | `home` | Yaklaşan aşı ve tedaviler, günün görevleri, sonraki ziyaret kartı. Kayıp modu düğmesi alt menüde. Randevu düğmesi yok |
| Sağlık kaydı | `records` | Kayıtlar elle girilir ve "Elle girildi" yazar. Tarama ve randevu düğmesi yok |
| Kilo | `weight` | Kayıt ve grafik. Sağlıklı aralık yalnızca kullanıcı girerse görünür |
| Hatırlatmalar | `lock-daily` | Bildirim ve "Yapıldı" ile "1 saat sonra" seçenekleri. Widget yok |
| Kayıp modu başlatma | `start-lost` | Basılı tutarak başlar. Listede yalnızca gerçekten olacak şeyler yazar |
| Arama | `lost` | Harita, ihbarlar, ilanı paylaşma, bulundu. Komşu sayısı ve arama düğmesi yok |
| İlan | `poster` | Story, gönderi ve A4 biçimleri, QR ve bağlantı. Telefon numarası yok |
| QR sayfası | `finder` | Uygulama gerektirmeyen web sayfası. Bulan kişi konum ve mesaj gönderir |
| Bulundu | `found` | Kayıp modu kapanır, süre ve ihbar sayısı görünür. Randevu önerisi yok |
| Veteriner listesi | `find-vet` | Yakınlığa göre liste. Harita, puan ve süzgeç yok |
| Randevu alma | `book` | Hayvan, neden, gün, saat ve telefon. Sağlık kaydı paylaşımı yok |

## İlk sürüm: tasarımda olmayan, eklenmesi gereken ekranlar

Bu ekranlar yeni özellik değil, onaylanan özelliklerin çalışması için gerekli. Mevcut görsel dille tasarlanacak.

- Apple ile giriş
- Aşı, tedavi ve ziyaret kaydı ekleme formu (tarama olmadığı için şart)
- Kilo ekleme formu
- Görev ve hatırlatma ekleme formu
- Tüm görevler listesi (bugün görünmeyen görevleri düzeltmek ve silmek için)
- Hayvanlar listesi (alt menüdeki sekme için)
- Sağlık kaydının Tedaviler ve Ziyaretler bölümleri
- Ayarlar ve hesap silme (Apple, hesap açılan uygulamalarda hesap silmeyi uygulama içinde ister)
- QR sayfasındaki konum ve mesaj gönderme formu
- Yazdırılabilir QR kodu ekranı

- Veteriner girişi ve kayıt
- İşletme profili (klinik bilgileri, çalışma saatleri, harita konumu)
- Veteriner randevu paneli (bekleyen, yaklaşan, geçmiş; onayla, reddet, iptal et)
- Sahip için Randevularım
- Backoffice paneli (uygulamada değil, tarayıcıda)

Sahibin alt menüsünde Bugün, Hayvanlar, ortada Hayvanım kayıp, Veterinerler ve Ayarlar var. Kayıtlar ve Ziyaretler sekmeleri kalktı, çünkü sağlık kaydı hayvan başına tutuluyor ve hayvana dokununca açılıyor. Tasarımdaki "+" düğmesi kapsam dışı. Veterinerin alt menüsünde Randevular, İşletme ve Ayarlar var.

## Sonraya kalanlar

| Özellik | Tasarımdaki adı | Neden sonra |
|---|---|---|
| Karne tarama | `scan` | İlk güncellemede. Ücretli yapay zekâ gerektiriyor, yanlış tarih sağlık riski yaratır |
| Yıldız puanı ve yorumlar | `find-vet` içinde | Başta veri yok, sahte yorum riski var |
| Sağlık kaydını veterinerle paylaşma | `book` içinde | Erişim kuralları ve daha ağır bir KVKK metni gerekiyor |
| Klinik haritası, arama ve süzgeçler | `find-vet` içinde | Klinik sayısı artınca anlamlı |
| Kilit ekranı canlı kartı | `lock-lost` | Temel akış oturduktan sonra |
| Kilit ekranı widget'ları | `lock-daily` içinde | Temel akış oturduktan sonra |
| 2 km komşu alarmı | | Yeterli kullanıcı gerekiyor |
| Klinik mührü, veteriner ve barınak bildirimi | | Kliniklerin katılması gerekiyor |
| Numarası gizli arama | | Ücretli arama servisi gerekiyor |
| Fiziksel künye | | Fiziksel ürün, ilk sürümde QR yazdırılır |
| Android | | Expo seçilirse aynı koddan eklenebilir |
| Hayvanı arşivleme | | Kayıtları saklayıp hatırlatmaları durdurur. İlk sürümde yalnızca sayılı onaylı silme var |
| Hayvan fotoğrafını kaldırma | | Şimdilik yalnızca değiştirilebiliyor |

## Açık işler

- [ ] TürkPatent'te "Patika" markasını kontrol et (9, 42 ve 44. sınıflar): https://www.turkpatent.gov.tr/arastirma-yap?form=trademark
- [ ] Kontrol temizse patika.pet alan adını satın al
- [ ] Apple geliştirici üyeliğini aç (Apple ile giriş adımında gerekecek, 99 dolar/yıl, TL fiyatı doğrulanmadı)
- [ ] Gizlilik politikası ve KVKK metnini hazırla
- [ ] Gizlilik metnine Ayarlar'dan bağlantı ver: Apple bu bağlantıyı hem mağaza sayfasında hem uygulamanın içinde ister
- [ ] Backend'i internete açık bir sunucuya al (TestFlight'tan önce şart): barındırma seçimi, HTTPS, kalıcı alan adı, veritabanı ve fotoğraf yedeği, izleme. Şimdilik yalnızca bu bilgisayarda çalışıyor, QR sayfası dışarıdan açılmıyor, telefon başka ağdayken eşitleme yapmıyor
- [ ] Supabase projesini sil: yeni sunucu iPhone'da doğrulandı (5 Kasım 2026), kullanıcı kendisi yapacak. İçinde deneme kayıtları, açık bir kayıp ilanı (Şanslı) ve herkese açık fotoğrafı duruyor
- [ ] Gerçek kişiler kullanmadan önce (TestFlight öncesi) avukata danış: sunucu yurt dışındaysa KVKK standart sözleşmesi gerekiyor, Türkiye'deyse bu yükümlülük doğmayabilir. Çözülmeden sunucuya gerçek kullanıcı verisi konmayacak
- [ ] Expo'nun widget sınırlamalarını kontrol et (widget aşamasında)
- [ ] Karşılama ekranındaki kedi ve köpek fotoğraflarının App Store'da kullanım hakkını kontrol et
- [ ] Hesap silmeyi tamamla: düğme ve sunucu ucu hazır. Eksik: Apple'ın istediği giriş izni iptali (Apple geliştirici üyeliği gerektirir). Sunucu silme sırasında Apple'a iptal isteği gönderecek. App Store'dan önce şart
- [ ] Kodun internette yedeği yok, iki repo da yalnızca bu bilgisayarda: özel GitHub deposu aç
- [ ] Kendi derlememize geçince backend'in `APPLE_AUDIENCES` ayarına uygulama kimliğini ekle, yayından önce `host.exp.Exponent` değerini çıkar (Expo Go'ya özel deneme izni). `ALLOW_DEV_LOGIN` gerçek sunucuda kapalı olmalı
- [ ] Android sürümü için Apple dışında bir giriş yöntemi seç
- [ ] Uygulama kapalıyken ihbar bildirimi: Apple geliştirici üyeliği ve kendi derlememiz gerekiyor, TestFlight'tan önce yapılacak (Expo Push Service). Şimdilik ihbarlar uygulama açıkken anında, kapalıyken açılınca görünüyor. Yönetici ilanı kaldırma haberi de aynı yolla gidecek: uygulama kapalıyken kaldırılan ilan şimdilik Bugün ekranından açıklamasız düşüyor
- [ ] TestFlight'tan önce kayıp sayfasına bot koruması ekle: şu anki ihbar sınırını kötü niyetli biri doldurursa gerçek ihbarlar da engellenir
- [ ] Bulunan ilanların ihbarlarını ve tam konumunu (iletişim bilgisi içeriyor) belli bir süre sonra otomatik sil, süreyi gizlilik metnine yaz. Kayıp sayfasına aydınlatma metni bağlantısı koy
- [ ] Gerçek sunucu öncesi güvenlik: girişli uçlara kullanıcı başına kota ve dakikalık sınır, canlı bağlantı sayısına sınır, Apple girişinde tek kullanımlık değer (nonce), `TRUST_PROXY` için güvenilen sunucu sayısı, kapıyı yalnızca önündeki sunucuya açmak. Panel için: HTTPS arkasında `TRUST_PROXY=true` olmadan çerez `Secure` almaz, önündeki sunucu `Host` başlığını korumalı, e-posta kilidi gerçek yöneticiyi de dışarıda tutabilir (iki aşamalı giriş gelince gevşetilecek)
- [ ] Uygulama ikonu hâlâ Expo şablonunun simgesi: kendi derlememizde tasarımdaki tasma künyesi simgesiyle değiştirilecek. Açılış ekranı bu simgeyi zaten kullanıyor (`assets/images/splash-icon.png`, tasarımdaki `#appicon` çiziminden üretildi)
- [ ] Gerçek sunucuya geçmeden önce panel deneme hesabını kaldır: `npm run admin -- remove yonetici@patika.test`, `panel-hesabi.txt` dosyasını sil. Gerçek hesabı kullanıcı kendi şifresiyle açsın
- [ ] Üst veri silinince fotoğraf yönü değişiyor mu gerçek telefon fotoğrafıyla dene (yön bilgisi de üst veride duruyor, kırpma aracı genelde görüntüyü zaten döndürüyor)
- [ ] Mağaza sürümünde konum izni metnini Türkçe göster ve kullanılmayan "her zaman" izin metinlerini kaldır
- [ ] Veteriner için şifre sıfırlama ve e-posta doğrulama: e-posta göndermek için alan adı gerekiyor. Şifre değiştirme de bununla gelecek
- [ ] Yayından önce en az bir semtte klinik bul: liste boş kalmasın
- [ ] Randevu bildirimi uygulama kapalıyken de gitsin (veteriner ve sahip için): Apple üyeliği ve kendi derlememiz gerekiyor, gerçek kliniklerle kullanmadan önce şart
- [ ] Avukata sor: backoffice panelinde kullanıcı hesapları, kayıp ilanları ve ihbarlardaki iletişim bilgileri yöneticiye görünüyor. Bu erişim gizlilik metnine yazılmalı, panel internete açılmadan önce iki aşamalı giriş ve işlem kaydı değerlendirilmeli
- [ ] Avukata sor: sahibin adı ve telefonu kliniğe gidiyor. Geçmiş randevuların ne kadar saklanacağını gizlilik metnine yaz
- [ ] Klinik sayısı binleri geçerse listeyi bölgeye göre indir (şimdilik tamamı indirilip telefonda sıralanıyor)
- [ ] Veteriner girişinde e-posta başına deneme sınırı (şimdilik yalnızca adres başına var)
- [ ] Android sürümü için Google Haritalar anahtarı al (yoksa harita zemini gri kalıyor, deneme APK'sında da öyle)
- [ ] Android mağaza sürümünde kod küçültmeyi (R8) düzelt: açıkken WorkManager veritabanı silindiği için uygulama açılışta kapanıyor. Deneme APK'sında küçültme kapalı
- [ ] Expo Simulators bekleme listesine katıl: https://expo.dev/services/simulators
- [ ] Apple geliştirici üyeliği açılınca iPhone'da otomatik testi yeniden değerlendir. Windows'tan kablo ile yalnızca ekran görüntüsü ve kayıt okunabiliyor, dokunma için imzalı WebDriverAgent gerekiyor (bu bilgisayarda denenmedi)
- [ ] QR sayfasında konumu gerçek iPhone'da dene: tarayıcılar konum iznini yalnızca HTTPS sayfalarda veriyor, yerel `http` adresinde "Konumumu ekle" çalışmaz. Gerçek sunucuda ya da HTTPS tünelle denenecek
- [ ] Android sürümüne geçince iki Expo Go hatasını kendi derlemede yeniden dene: bildirim kanalı oluşturma (`setNotificationChannelAsync` NullPointerException) ve bildirime dokununca çökme (`LauncherActivity`, veritabanı hatası)
- [ ] Android sürümünde hatırlatmalara `delivery: 'alarmClock'` ayarını ve tam zamanlı alarm iznini ekle. Expo Go'da bu izin olmadığı için bildirim 27 dakika ile 1 saat arasında gecikebiliyor (taklitçide görüldü)
- [ ] Android sürümünde düğmeye basılan bildirimin kapandığını kendi derlemede dene (Expo Go'da ekranda kalıyor)

## Yol haritası

1. İsim ve marka kontrolü
2. Kurulum ve boş uygulamayı iPhone'da açma (tamamlandı, SDK 58 App Store'daki Expo Go ile açıldı)
3. Günlük bakım ekranları ve hatırlatmalar (başladı: Karşılama, Hayvan ekleme, Sağlık kaydının aşı, tedavi ve ziyaret bölümleri (düzeltme ve silme dahil), hatırlatmalar, görevler, Bugün listesi, alt menü, Hayvanlar listesi ve kilo kodlandı ve iPhone'da denendi. Bu aşama tamamlandı)
4. Hesap sistemi, kendi backend'imiz, kayıp ilanı ve QR sayfası (tamamlandı, iPhone'da denendi. Hesap silmede yalnızca Apple izni iptali kaldı, üyelik gerektiriyor)
5. Veteriner hesabı, işletme profili, liste ve randevu sistemi (kodlandı, taklitçide geçti. iPhone'da kayıt, onay ve liste denendi, randevu gönderme ve onaylama bekliyor. Uygulama kapalıyken randevu bildirimi üyelik, şifre sıfırlama alan adı bekliyor)
6. Backoffice paneli (tamamlandı, tarayıcıda test edildi. Bu bilgisayardan açılıyor, internete açılınca HTTPS şart)
7. Backend'i internete açık sunucuya alma
8. TestFlight (Apple'ın deneme aracı) ile gerçek kişilerle test
9. App Store başvurusu ve Apple incelemesi

## İlerleme

Hedef: uygulamanın App Store'da yayında olması. Ağırlıklar işin büyüklüğüne göre verilmiş bir tahmindir, ölçüm değildir. Bir iş ancak iPhone'da denendikten sonra "Bitti" sayılır, bu yüzden iPhone testi sona kalan işler sonda puan kazanır. Kalan işler öğrenildikçe ağırlıklar değişebilir.

| İş | Ağırlık | Durum |
|---|---|---|
| Kurulum ve uygulama iskeleti | 4 | Bitti |
| Karşılama | 1 | Bitti |
| Hayvan ekleme | 3 | Bitti |
| Bugün ekranı | 4 | Bitti |
| Aşı, tedavi ve ziyaret kayıtları | 8 | Bitti |
| Görevler ve hatırlatmalar | 8 | Bitti |
| Hayvanlar listesi, düzenleme ve silme | 3 | Bitti |
| Kilo | 4 | Bitti |
| Veteriner hesabı, işletme profili ve onay | 8 | Kayıt, form ve onay iPhone'da denendi (6 puan). Yeniden giriş ve fotoğraf yükleme bekliyor (2 puan) |
| Veteriner listesi ve yakınlık sıralaması | 4 | Bitti |
| Randevu sistemi (istek, onay, ziyarete düşme, iptal) | 8 | Kodlandı, taklitçide geçti, iPhone'da randevu henüz gönderilmedi (0 puan, geçince 8) |
| Apple ile giriş, ayarlar ve hesap silme (hesap silme hariç 5 puan) | 8 | Giriş, ayarlar ve hesap silme düğmesi iPhone'da denendi (7 puan). Apple izni iptali üyelik bekliyor (1 puan) |
| Arayüz cilası: his, tepki ve erişilebilirlik | 6 | Kodlandı, taklitçide geçti. Titreşim ve iPhone hissi sondaki testte (0 puan, geçince 6) |
| Arayüz cilası: görsel kalite (boş ekranlar, fotoğrafsız hâl, veteriner listesi, ilan, ayarlar, açılış ekranı) | 4 | Başladı: hizalama, boş ekranlar (Bugün, Hayvanlar, hayvan sayfası), Ayarlar, veteriner listesi, ilandaki düğme kayması, Bugün'deki "sırada" kartının hizası, açılış ekranı, fotoğrafsız avatar ve ilan görseli kodlandı, taklitçide geçti. Paket kodda tamam, iPhone testinden önce puan almaz (0 puan) |
| Kendi backend'imiz ve verilerin sunucuya taşınması | 12 | Bitti |
| Kayıp modu (başlatma, arama, harita, ihbarlar, bulundu) | 15 | Bitti |
| İlan, QR sayfası ve yazdırılabilir QR | 12 | Bitti |
| Backoffice paneli (klinik onayı, özet rakamlar, ilan denetimi, kullanıcı yönetimi) | 8 | Bitti. Telefon gerektirmiyor, gerçek sunucuyla tarayıcıda test edildi. Uygulamadaki Apple girişi uyarısı sondaki iPhone testinde |
| Backend'i internete açma (barındırma, HTTPS, alan adı, yedek) | 6 | Başlamadı. Supabase bunu kendisi yapıyordu, kendi sunucuya geçince iş oldu |
| Marka, alan adı, gizlilik ve KVKK metinleri, fotoğraf hakları | 5 | Başlamadı |
| Kendi derlememiz, uygulama ikonu, TestFlight testleri | 7 | Başlamadı |
| App Store başvurusu ve inceleme düzeltmeleri | 6 | Başlamadı |

**Toplam: 144 puanın 99'u, yaklaşık %69.** Arayüz cilası plana 10 puanla girdi, oran bu yüzden %74'ten indi. Sondaki iPhone testi geçince 119 puan, yaklaşık %83 (görsel kalite paketi de kodda bitti, yalnızca bu testi bekliyor). Kalan 45 puan: veteriner girişi ve fotoğraf (2), randevu (8), arayüz cilasının iPhone testi (6), görsel kalitenin iPhone testi (4), Apple izni iptali (1), backend'i internete açma (6), marka ve metinler (5), kendi derleme ve TestFlight (7), App Store (6). Yeni içerik eklenirse toplam büyür, yüzde düşebilir: biten bir iş kaybolmuş olmaz.

## Test ve derleme

- **Şimdilik:** Kod Windows'ta yazılıyor. Testleri Claude bu bilgisayarda çalıştırıyor. Windows'ta sanal iPhone çalışmıyor, Playwright da iOS'u süremiyor.
- **Sonda yapılacak iPhone testi:** Kullanıcı işler bitince Mac'te test ettirecek. Sunucu şimdilik bu bilgisayarda: Mac aynı ağda değilse önce backend'in internete açılması gerekir. Sanal iPhone'da kamera yok, Apple ile giriş için sanal telefonda Apple hesabı açılmalı. Denenecekler:
  - Randevu: sahip istek gönderir ve Randevularım'da "Onay bekliyor" görür. Veteriner yeniden giriş yapar, Bekleyen'den onaylar. Sahip "Onaylandı" görür, ziyaret "Patika randevusu" etiketiyle düşer. İptal edince ziyaret kalkar
  - Veteriner: klinik fotoğrafı yükleme, veteriner hesabını silme
  - His: titreşimler (çip ve sekme seçimi, "Yapıldı", basılı tutma dolunca, kayıp başlatma, bulundu, bağlantı kopyalandı), basınca küçülme, iPhone'da kaydırarak geri dönerken de yarım form sorusu, sekme göstergesinin kayması, en büyük yazı ayarında ekranlar
  - Görünüş: alt menüdeki kayıp dairesi ve menünün üstüne taşan yerine dokunma, Apple Haritalar, saat seçici, klavyenin form alanlarını kapatmaması, bildirimin ekranda görünmesi, randevu ekranındaki gün ve saat seçimi, açılış ekranı (kâğıt zemin, ortada Patika simgesi), fotoğrafsız avatarda harfin dairenin ortasında durması, ilan önizlemesinin altındaki gölge, iPhone'da üretilen Story görselinde lacivert çerçeve
  - Panel kararları: kapatılan hesapla Apple girişinde "Bu hesap kapatıldı" uyarısı (taklitçide yalnızca veteriner girişi denendi)
- **Backend'i başlatma:** `Patika-Backend` klasöründe `docker compose up -d --build`. Telefon aynı ağda olmalı, uygulama sunucunun adresini kodu sunan bilgisayardan öğrenir (4000 numaralı kapı). Taklitçi için `adb reverse tcp:4000 tcp:4000`.
- **Deneme APK'sı:** `pwsh -File scripts\build-test-apk.ps1` (`apk\Patika-deneme.apk` üretir, Git'e girmez). İlk derleme parça indirdiği için 20-30 dakika, sonrakiler yaklaşık 10 dakika. Bilgisayarın ağ adresi değişirse `-ServerUrl` ile yeniden derlenir. Harita anahtarı alınınca `GOOGLE_MAPS_ANDROID_KEY` ile verilir.
- **Yönetim paneli:** `http://localhost:4000/admin`. Hesap yalnızca komutla açılır: `Patika-Backend` klasöründe `npm run admin -- create <e-posta>`. Deneme hesabı `yonetici@patika.test`, şifresi `Patika-Backend\panel-hesabi.txt` dosyasında (Git'e girmez). Gerçek sunucuda şifreyi kullanıcı yazar, Claude görmez. Klinik onayı artık buradan: onaylamadan önce oda sicil numarası kontrol edilmeli. Şifre şimdilik şifresiz `http` üzerinden gittiği için panele yalnızca bu bilgisayardan girilir.
- **Testler:**
  - `Patika-App`: `npm test` (tarih, görev, kilo, eşitleme, QR ve klinik kuralları), `npm run test:e2e` (taklitçide Playwright ile uygulamanın gerçek ekranları, piksel testleri dahil)
  - `Patika-Backend`: `npm test` (sunucu, erişim ve panel kuralları, gerçek MySQL), `npm run test:page` (kayıp sayfası: Safari motoru iPhone profilleri ve Chrome motoru; yönetim paneli: Chrome motoru masaüstü ve telefon genişliği; piksel testleri dahil)
  - Senaryo listesi ve kapsanmayanlar: `e2e/SENARYOLAR.md`
- **Taklitçiyi başlatma:** `C:\Users\user\AppData\Local\Android\Sdk\emulator\emulator.exe -avd patika`. Sunucuyu önce `$env:ANDROID_HOME = 'C:\Users\user\AppData\Local\Android\Sdk'` ayarlayıp `npx expo start --android` ile başlat. Java `C:\Users\user\AppData\Local\Android\jdk17` klasöründe.
- **Sonra:** Expo Go sınırlı bir deneme aracı. Ek yerel modül (uygulamanın telefon özelliklerine bağlanan parçası) gerektiğinde uygulamanın kendi geliştirme sürümü derlenecek. Bunun iPhone'da çalışması için Apple geliştirici üyeliği gerekecek.
- **Yayın:** Derleme ve App Store'a gönderim EAS (Expo'nun bulut servisi) ile yapılabiliyor, Mac şart değil. EAS ücretlerine henüz bakılmadı.

**Windows'tan iPhone testi (5 Kasım 2026 araştırması):** Sanal iPhone yalnızca macOS'ta çalışıyor, ama uzaktaki bir Mac'te çalışanı Windows'tan kullanılabiliyor.

- **Kendi Mac'imiz (önerilen, henüz denenmedi):** Kod Windows'ta kalır, sanal iPhone Mac'te açılır, SSH ile yönetilir. Ücretsiz, ama Mac'in açık ve aynı ağda olması, Xcode kurulması gerekir.
- **Expo Simulators:** Tam ihtiyacımız olan hizmet, Claude Code ile kullanılabiliyor. Sınırlı önizlemede, bekleme listesi var: https://expo.dev/services/simulators
- **Appetize:** Bulutta sanal iPhone, tarayıcıdan. Ücretsiz plan ayda 30 dakika, ücretli plan 59 dolardan başlıyor.
- **GitHub Actions veya EAS Maestro:** Betikli test için. Canlı oturum yok.
- **macOS sanal makinesi kullanılmaz:** Apple lisansı Apple donanımı dışında izin vermiyor.

**Bu projede öğrenilenler:**

- Git'te ana hatta (`master`) çalışılıyor, kullanıcı böyle seçti.
- Windows'ta `npx expo login` tarayıcı açarken hata verip kapanıyor. Girişte `npx expo login --no-browser` kullan.
- Yeni paket kurulunca sunucu dosyaları göremeyebilir. `npx expo start --clear` ile yeniden başlat.
- Web önizlemesi için `app.json` içinde `web.output` değeri `single`. `server` değeri ekran genişliğini 0 sayıp sayfayı bozuyordu. QR sayfası backend'den yayınlandığı için bu ayarı değiştirmek gerekmedi.
- İkon paketi çok büyük. İkonları tek tek al: `phosphor-react-native/src/icons/Check`.
- `android emulator create` istenmeyen ek bir telefon görüntüsü indiriyor. Sanal telefon oluştururken `avdmanager` kullan. `android` aracını `--no-metrics` ile çalıştır.
- Taklitçi testlerinde ekran görüntülerini `/sdcard` yerine `/data/local/tmp` altına al, yoksa fotoğraf seçicinin galerisine düşüyorlar.
- Taklitçi yeni açıldığında Expo Go `Failed to download remote update` diyebiliyor. `adb reverse tcp:8081 tcp:8081` çalıştırıp projeyi `exp://127.0.0.1:8081` adresiyle aç. `adb root` bu yönlendirmeyi siler, yeniden çalıştır.
- Taklitçide bildirimi saatinde bekleme: alarmın esneme payı var (`dumpsys alarm` içinde `window`). Saati bu payın ötesine al. `am force-stop` alarmları da siler, uygulama kapalıyken deneme için `am kill` kullan.
- Taklitçide eşitleme: Ayarlar'daki "Deneme hesabıyla gir" (yalnızca geliştirirken, backend'de `ALLOW_DEV_LOGIN=true`). Her basış yeni, boş bir hesap açar. iPhone'da girişsiz Ayarlar'a ulaşılamadığı için aynı düğme orada Karşılama'da duruyor. Silme gibi geri alınamayan denemelerde gerçek Apple hesabı yerine bunu kullan.
- Taklitçide basılı tutma `adb shell input swipe X Y X Y 1400`, konum verme `adb emu geo fix BOYLAM ENLEM`. Kaydırırken ekranın kenarından kaydır, ortada harita varsa hareket haritaya gider.
- Playwright Android sürücüsü: `device.wait` uygulama açılırken güvenilir değil, `device.info` ile yokla. Metin eşleştirmesi yazının tamamına bakar, "içinde geçiyor" için `/.*yazı.*/`. Android onay düğmeleri büyük harfli gelir.
- Expo Go'da PDF'in yazıldığı `cache/Print` klasörüne dosya ve paylaşım modülleri erişemiyor. PDF içerik olarak alınıp kendi klasörümüze yazılıyor.
- `File.move` ve `File.write` bu SDK'da bekleme gerektiriyor (`await`). Beklenmezse hata sessizce kaybolur, tip kontrolü de yakalamaz.
- Expo Go'nun ekranda yüzen "Tools" düğmesi dokunuşları kendine alıyor: taklitçide arada ilk dokunuş uygulamaya ulaşmıyordu. Düğme, geliştirici menüsündeki "Tools button" anahtarıyla kapatılıyor. Gerçek uygulamada yok.
- Piksel testinde `--update-snapshots` hiçbir şey karşılaştırmaz. Görseli yeniledikten sonra bayraksız çalıştır.
- Metro, açıkken eklenen yeni dosyayı bazen görmüyor (`Unable to resolve`). `npx expo start --clear` ile yeniden başlat. Yeni ekran dosyasında Expo Go eski kodla "Unmatched Route" demeye devam eder: `am force-stop host.exp.exponent`, önce `exp://127.0.0.1:8081` adresini aç, sonra ekrana git (soğuk açılışta doğrudan ekran adresi uygulamayı açmıyor).
- Taklitçide klavye açılınca ekran küçülmüyor (Android, kenardan kenara ekran). Uzun formlarda `KeyboardAvoidingView` iki platformda da `padding` olmalı. Playwright'ın `fill` komutu önce alana dokunuyor: alan klavyenin altında kalırsa "Timed out waiting for selector" der.
- Çok satırlı alanda `KEYCODE_ESCAPE` klavyeyi kapatmıyor, `phone.hideKeyboard` gerekirse "geri" de basar.
- Klavyenin "Try out your stylus" penceresi taklitçide ekranı kapatabiliyor: `settings put secure stylus_handwriting_enabled 0`.
- Randevu testinde telefon gelecek pazartesiye alınıyor, sunucu gerçek saatte kalıyor. Sunucu saatine bağlı kurallarda bu fark hesaba katılmalı (`e2e/04-veteriner.spec.ts`).
- Expo Go konum iznini her proje için ayrıca soruyor, `pm grant` yetmiyor.
- Expo Go kod dosyası değişince üstte mavi "Refreshing..." şeridi gösteriyor, kod değişikliğinden sonraki ilk turda görsele girebiliyor. `phone.ts` şerit kalkmadan görüntü almıyor. Yenileme turundan sonra `git status` ile yalnızca beklenen görsellerin değiştiğine bak.
- Sekme değiştirince iki ekranda da bulunan yazıyı bekleme: geçiş bitmeden dokunulursa eski konuma denk gelir. Yalnızca hedef ekranda olan bir öğeyi bekle.
- Piksel testinde oranlı sınır (`maxDiffPixelRatio`) yeni eklenen bir düğmeyi kaçırdı: büyük ekranda %0,1 binlerce piksel ediyor. Sınır piksel sayısıyla verilir (`maxDiffPixels`). Ekranı değiştirince karşılaştırma görseli değişmediyse test bir şey görmüyor demektir, ona bak.
- Docker görüntüsü kayıp sayfasını içinde taşıyor: `public/` değişince yeniden derle, yoksa testler de telefon da eski sayfayı görür.
- `phone.ps1` Türkçe büyük harfi eşleştiremiyor: onay düğmesine "ÇIKIŞ YAP" gibi tam yazılışıyla dokun.
- Expo Go'nun dişli düğmesi sağ üstte duruyor ve oradaki düğmelerin üstüne biniyor. Taklitçide `adb shell input swipe 971 110 971 1700 600` ile kenara çek. Gerçek uygulamada yok.
- Alt menüde `left` ve `right` işe yaramıyor, kenar boşluğu `marginHorizontal` ile veriliyor.
- Alt menüde düğme menünün dışına taşacaksa o sekmenin `tabBarItemStyle` değerinde `overflow: 'visible'` gerekir, ortak ayar kırpıyor. Taşan yere Android'de de dokunulabiliyor (taklitçide denendi).
- Metro uzun süre açık kalınca belleği dolup kapanıyor (16 saat sonra 4 GB, `heap out of memory`). Uygulama açılmıyorsa önce buna bak, `npx expo start` ile yeniden başlat.
- Reanimated, Android'de animasyon hızı 0 olunca (testler böyle ayarlıyor) bunu "hareketi azalt" sayıp animasyonları atlıyor: piksel testleri kararlı kalır. İşlevi olan süreli hareketler (basılı tutma çubuğu) bu yüzden `ReduceMotion.Never` ile yazılır, yoksa çubuk anında dolar.
- Yarım form koruması (`useDiscardGuard`): form kaydettikten ya da sildikten sonra kendini kapatmadan önce `allowLeave()` çağırmalı, yoksa kendi kapanışında da soru çıkar.
- Ortak `Tappable` kapalı düğmeyi kendisi soluklaştırır. Kapalı değil yalnızca dokunulamaz bir satırsa (konumsuz ihbar) `dimWhenDisabled={false}` verilir.
- Windows'ta Android C++ derlemesi yol sınırına takılıyor: `C:\pa` gibi kısa klasör ve `-DCMAKE_OBJECT_PATH_MAX=240` birlikte gerekiyor. Android projesi kaynak klasörde üretilmez, `expo prebuild` orada `package.json` dosyasını da değiştiriyor.
- Soğuk açılan taklitçide `adb emu geo fix` konum üretmez, çünkü GPS isteyen yoktur. Uygulama da Google'ın Konum Doğruluğu izin penceresine düşer. O izin verilmez, testte `cmd location providers` ile test sağlayıcısı kullanılır (`e2e/04-veteriner.spec.ts`).
- Windows'ta girdi okuyan bir komut işini bitirse de kapanmayabilir: `stdin.pause()` yetmiyor, sonda `stdin.destroy()` gerekiyor.
- "X görünmez" testinde X'in gerçekten yazıldığını da denetle. Yanlış adrese kayıt gönderen test, ortada kayıt olmadığı için boşuna geçiyordu.
- Uygulama arka plandan dönünce ekran yenilensin diye tarih hesapları veriyle birlikte okunan `now` değerini kullanıyor. React Compiler hesabı önbelleğe aldığı için bileşen içindeki `new Date()` eski kalabiliyor.
- Taklitçi donabiliyor: test tek satır yazmadan saatlerce bekler, `adb shell echo` bile yanıt vermez. Taklitçiyi kapatıp `-no-snapshot-load` ile aç, `adb reverse` komutlarını yeniden çalıştır.
- Alt menü sekmelerine yazıyla değil etiketle dokun (`tapLabel('Bugün')`): "Bugün" gibi yazılar kartlarda da geçiyor, yazıyla arayınca ilk eşleşen karta dokunuluyordu.
- Aynı yazı ekranda iki kez varsa dokunulabilir kartın etiketiyle dokun (`tapButtonWith`): kartın etiketi içindeki yazıların birleşimi ("Karma aşı, Yapıldı, ..."). Playwright'ın `hasDescendant` araması bu uygulamada sürücü bağlantısını koparıyor.
- Telefonda kurulu bekleyen bildirimler `dumpsys alarm` içinde yalnızca `tag=*walarm*:expo.modules.notifications` ile başlayan satırlar. `type=RTC_WAKEUP tag=` ile başlayanlar geçmiş kayıt.
- Mantık testleri `src/lib` içinde simge (phosphor) içe aktaran bir dosyayı yükleyemiyor (`.tsx` uzantısı). Test edilecek hesaplar ayrı, simgesiz dosyada durmalı (`pet-facts.ts` gibi).
- Expo Go uygulamanın açılış ekranını göstermiyor: görmek için deneme APK'sı derlenir. Android açılış görselini 288 birimlik alanın ortasında 192 birim çaplı bir daireye sığdırıyor, dışı kesiliyor. `imageWidth` bu yüzden 120 (köşesi yuvarlak kare daireye sığıyor).
- Süs niteliğindeki öğe (avatar) `importantForAccessibility="no-hide-descendants"` ve `accessibilityElementsHidden` ile ekran okuyucudan gizlenir. Gizlenmezse içindeki yazı dokunulabilir kartın etiketine karışır ("Ş, Şanslı, ..."), ekran okuyucu da testler de bunu görür.
- Sunucu verisi gerektiren bir görünümü uç durumlarla denemek için geçici bir ekran dosyası (`src/app/<ad>.tsx`) sahte veriyle bileşeni çizer, taklitçide `exp://127.0.0.1:8081/--/<ad>?...` ile açılır. Git'e girmeden silinir.
- Projede Prettier ayarı yok: düz `npx prettier --write` bütün dosyayı çift tırnağa çevirir. Projenin biçimi `--single-quote --print-width 100 --bracket-same-line`, yalnızca dokunulan satırlara bak.

## Pazar bilgisi (5 Kasım 2026'da kontrol edildi)

Türkiye'de telefonların yaklaşık %74'ü Android, %26'sı iPhone (StatCounter, Temmuz 2026).

App Store'daki benzer adlı uygulamalar:

- [Patika: Kayıp & Sahiplendirme](https://apps.apple.com/tr/app/patika-kay%C4%B1p-sahiplendirme/id6802413561): en yakın rakip. Ağustos 2026'da çıktı, düzenli güncelleniyor. Mağaza metni kayıp ilanı, QR kimlik, aşı hatırlatma ve dijital karneden söz ediyor.
- [Patika: Pet Companion](https://apps.apple.com/tr/app/patika-pet-companion/id6767281390): aşı, ilaç ve mama takibi. Mayıs 2026.
- [Patika Pet](https://apps.apple.com/us/app/patika-pet/id6762758279): evcil hayvan sosyal ağı. Nisan 2026.

Uygulamalar denenmedi, yalnızca mağaza metinleri okundu.

## Sunucu araştırması (5 Kasım 2026'da kontrol edildi)

Geçmiş kayıt: Kendi backend'imize geçilince bu seçenekler bırakıldı. KVKK notları hâlâ geçerli.

Fiyatlar resmî sayfalardan okundu, değişebilir. Hiçbir seçeneğin Türkiye'de sunucusu yok.

| | Supabase | Firebase | Convex |
|---|---|---|---|
| Ücretsiz plan | 500 MB veri, 1 GB dosya, 500 bin sunucu işlevi çağrısı. 1 hafta kullanılmazsa duraklar, otomatik yedek yok | 1 GB veri. Sunucu işlevi ve dosya depolama ücretsiz planda yok | 0,5 GB veri, 1 GB dosya |
| Ücretli plan | Aylık 25 dolardan başlar, günlük yedek, harcama sınırı varsayılan açık | Kullandığın kadar öde. Toplam harcama sınırı yok, yalnızca bazı servislerde var | Geliştirici başına aylık 25 dolar |
| Avrupa'da veri | Frankfurt | Var, ama ücretsiz dosya kotası yalnızca ABD bölgelerinde | İrlanda, %30 ek ücretli |
| Apple ile giriş | Belgeli, Expo Go'da denenebilir | Bugün ayrıca doğrulanmadı | Beta |

**KVKK:** Sunucusu yurt dışında olan servis, yurt dışına veri aktarımı sayılıyor. Kurumun kendi standart sözleşmesi imzalanıp 5 iş günü içinde bildirilmeli, AB sözleşmesi tek başına yetmiyor. Hukuk bürolarının yazılarına göre, bildirilmezse 2026 için 90.308 ile 1.806.177 TL arası ceza var. Supabase, Google veya Convex'in bu sözleşmeyi imzalayıp imzalamadığına dair kaynak bulunamadı. Türkiye'de sunucu kullanılırsa bu yükümlülük doğmuyor. Bu notlar hukuki görüş değildir.

## Tasarım kaynakları

Hepsi `C:\Users\user\Desktop\Portfolyolar\Behance\Patika` klasöründe:

- `screens.html` ve `styles.css`: tüm ekranlar ve görsel kurallar
- `case-study.html`: ürün hikâyesi, akışlar ve bileşenler
- `export/screens/`: ekran görselleri
- `img/`: fotoğraflar

**Renkler:** Tasma mavisi `#1D2452` (metin, ana düğmeler), Tenis topu `#D9F26B` (tamamlandı, yaklaşıyor, bulundu), Pati pembesi `#F7BACB`, Lavanta `#BDD0FF`, Kâğıt `#F3F2FA` (arka plan), Fosforlu `#FF4F1A` (yalnızca kayıp modu).

**Yazı tipleri:** Unbounded (başlıklar ve sayılar), Figtree (arayüz metni). **İkonlar:** Phosphor.
