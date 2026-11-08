import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Titreşim yalnızca hissi güçlendirir, hiçbir iş ona bağlı değil.
// Desteklemeyen telefonda ve tarayıcıda sessizce geçilir.
function safely(run: () => Promise<void>) {
  if (Platform.OS === 'web') {
    return;
  }
  run().catch(() => undefined);
}

// Seçenek değişti: çip, sekme, gün ve saat seçimi.
export function selectionHaptic() {
  safely(() => Haptics.selectionAsync());
}

// Bir eşik aşıldı: basılı tutma çubuğu doldu.
export function impactHaptic() {
  safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

// İş tamam: "Yapıldı", kayıp modu başladı, hayvan bulundu, bağlantı kopyalandı.
export function successHaptic() {
  safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

// Kaydedilemedi ya da gönderilemedi.
export function errorHaptic() {
  safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
