import type { AndroidDevice } from 'playwright';
import { PNG } from 'pngjs';

import { APP_URL } from './config';

const PACKAGE = 'host.exp.exponent';
// Saat ve pil simgesinin bulunduğu şerit her ekran görüntüsünde kapatılır, değişken bilgi taşır.
const STATUS_BAR_PX = 66;

const POLL_MS = 300;
const KEYBOARD_SAFE_Y = 1150;

// Expo Go, kod dosyası değişince üstte kısa süre mavi "Refreshing..." şeridi gösteriyor. Gerçek uygulamada yok.
const REFRESH_BANNER = { x: 8, y: 86, rgb: [37, 132, 232] };
const REFRESH_BANNER_TIMEOUT_MS = 30_000;

type Region = { x: number; y: number; width: number; height: number };
type Selector = { text?: string | RegExp; desc?: string | RegExp };

const replacer = (_key: string, value: unknown) => (value instanceof RegExp ? String(value) : value);

// Taklitçideki uygulamayı Playwright ile süren küçük yardımcı.
export class Phone {
  readonly device: AndroidDevice;

  constructor(device: AndroidDevice) {
    this.device = device;
  }

  async openApp({ clearData = false } = {}) {
    await this.device.shell(`am force-stop ${PACKAGE}`);
    if (clearData) {
      await this.device.shell(`pm clear ${PACKAGE}`);
      for (const permission of ['POST_NOTIFICATIONS', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION']) {
        await this.device.shell(`pm grant ${PACKAGE} android.permission.${permission}`);
      }
    }
    await this.launch();
    if (clearData) {
      // Expo Go ilk açılışta geliştirici menüsünü tanıtıyor. Gerçek uygulamada yok.
      await this.see('Continue', 150_000);
      await this.tap('Continue');
      await this.wait(1000);
      // Expo Go'nun ekranda yüzen "Tools" düğmesi dokunuşları kendine alıyor: arada ilk dokunuş
      // uygulamaya hiç ulaşmıyordu. Gerçek uygulamada bu düğme yok, testlerde kapatılır.
      await this.device.shell('input swipe 540 2200 540 1100 400');
      await this.wait(600);
      await this.tap('Tools button');
      await this.wait(600);
      await this.back();
    }
  }

  // Uygulama arka plana gidip geri gelir: açılışta eşitleme ve yeniden okuma tetiklenir.
  async backgroundAndReturn() {
    await this.device.shell('input keyevent KEYCODE_HOME');
    await this.wait(800);
    await this.launch();
  }

  // Expo Go kapatılıp hemen açılınca açılış isteği arada boşa düşüyor, ön plana gelene kadar yinelenir.
  private async launch() {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.device.shell(`am start -a android.intent.action.VIEW -d ${APP_URL}`);
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        const focus = (await this.device.shell('dumpsys window | grep mCurrentFocus')).toString();
        if (focus.includes('ExperienceActivity')) {
          return;
        }
        await this.wait(500);
      }
    }
    throw new Error('Expo Go açılmadı');
  }

  wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Sürücünün kendi bekleme komutu uygulama yeniden açılırken güvenilir değil, kendimiz yoklarız.
  private async find(selector: Selector, timeout: number) {
    const deadline = Date.now() + timeout;
    for (;;) {
      try {
        return await this.device.info(selector);
      } catch (error) {
        if (Date.now() > deadline) {
          throw new Error(`Ekranda bulunamadı: ${JSON.stringify(selector, replacer)}`, { cause: error });
        }
      }
      await this.allowExpoGoPermission();
      await this.wait(POLL_MS);
    }
  }

  // Expo Go her proje için izni ayrıca soruyor. Gerçek uygulamada bu pencere yok.
  private async allowExpoGoPermission() {
    const prompt = await this.device.info({ text: 'ALLOW' }).catch(() => null);
    if (prompt) {
      await this.device.tap({ text: 'ALLOW' });
    }
  }

  async see(text: string | RegExp, timeout = 25_000) {
    await this.find({ text }, timeout);
  }

  async gone(text: string | RegExp, timeout = 20_000) {
    const deadline = Date.now() + timeout;
    while (await this.has(text, 0)) {
      if (Date.now() > deadline) {
        throw new Error(`Ekrandan gitmedi: ${text}`);
      }
      await this.wait(POLL_MS);
    }
  }

  async seeLabel(desc: string | RegExp, timeout = 25_000) {
    await this.find({ desc }, timeout);
  }

  async has(text: string | RegExp, timeout = 1200) {
    return this.find({ text }, timeout).then(() => true, () => false);
  }

  async tap(text: string | RegExp) {
    await this.find({ text }, 25_000);
    await this.device.tap({ text });
  }

  async tapLabel(desc: string | RegExp) {
    await this.find({ desc }, 25_000);
    await this.device.tap({ desc });
  }

  async fill(label: string, value: string) {
    const { bounds } = await this.find({ desc: label }, 25_000);
    // Sürücü önce alana dokunur. Klavye açılınca alan altında kalırsa yazamaz, önce yukarı alınır.
    if (bounds.y > KEYBOARD_SAFE_Y) {
      await this.device.shell(`input swipe 25 ${bounds.y} 25 ${bounds.y - 700} 500`);
      await this.wait(500);
    }
    await this.find({ desc: label }, 25_000);
    await this.device.fill({ desc: label }, value);
  }

  async hideKeyboard() {
    await this.device.shell('input keyevent KEYCODE_ESCAPE');
    await this.wait(400);
    // Çok satırlı alanda bu tuş klavyeyi kapatmıyor. Klavye açıkken "geri" ekranı kapatmaz, yalnızca klavyeyi.
    const state = (await this.device.shell('dumpsys input_method | grep mInputShown')).toString();
    if (state.includes('mInputShown=true')) {
      await this.back();
    }
  }

  async back() {
    await this.device.shell('input keyevent KEYCODE_BACK');
    await this.wait(500);
  }

  // Yazı ekranda değilse aşağı kaydırarak arar.
  async scrollTo(text: string | RegExp, attempts = 8) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (await this.has(text, 500)) {
        return;
      }
      // Ekranın kenarından kaydırılır: ortada harita varsa hareket haritaya gider.
      await this.device.shell('input swipe 25 1800 25 900 450');
      await this.wait(400);
    }
    throw new Error(`Ekranda bulunamadı: ${text}`);
  }

  async scrollToTop() {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await this.device.shell('input swipe 25 500 25 2000 250');
    }
    await this.wait(300);
  }

  async boundsOf(selector: { text?: string | RegExp; desc?: string | RegExp }) {
    return (await this.device.info(selector)).bounds;
  }

  // Gerçek parmak dokunuşu gibi ekrana basar. Küçük düğmelerde sürücünün komutu her zaman etki etmiyor.
  async touch(selector: Selector) {
    const { x, y, width, height } = await this.find(selector, 25_000).then((info) => info.bounds);
    await this.device.shell(`input tap ${Math.round(x + width / 2)} ${Math.round(y + height / 2)}`);
  }

  // Basılı tutarak başlatılan düğme için.
  async hold(text: string, ms = 1400) {
    const { x, y, width, height } = await this.boundsOf({ text });
    const cx = Math.round(x + width / 2);
    const cy = Math.round(y + height / 2);
    await this.device.shell(`input swipe ${cx} ${cy} ${cx} ${cy} ${ms}`);
  }

  // Şerit görsele girmesin diye kalkması beklenir. Kalkmazsa görüntü olduğu gibi döner, karşılaştırma kalır.
  private async captureWithoutRefreshBanner() {
    const deadline = Date.now() + REFRESH_BANNER_TIMEOUT_MS;
    for (;;) {
      const image = PNG.sync.read(await this.device.screenshot());
      const index = (image.width * REFRESH_BANNER.y + REFRESH_BANNER.x) * 4;
      const hasBanner = REFRESH_BANNER.rgb.every((value, channel) => image.data[index + channel] === value);
      if (!hasBanner || Date.now() > deadline) {
        return image;
      }
      await this.wait(POLL_MS);
    }
  }

  async screenshot(masks: Region[] = []) {
    await this.allowExpoGoPermission();
    const image = await this.captureWithoutRefreshBanner();
    for (const mask of [{ x: 0, y: 0, width: image.width, height: STATUS_BAR_PX }, ...masks]) {
      for (let y = mask.y; y < Math.min(mask.y + mask.height, image.height); y += 1) {
        for (let x = mask.x; x < Math.min(mask.x + mask.width, image.width); x += 1) {
          const index = (image.width * y + x) * 4;
          image.data[index] = 128;
          image.data[index + 1] = 128;
          image.data[index + 2] = 128;
          image.data[index + 3] = 255;
        }
      }
    }
    return PNG.sync.write(image);
  }
}

