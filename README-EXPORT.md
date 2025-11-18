# Vakt-i Namaz PWA Projesi - Export Paketi

## 📦 İçerik
Bu ZIP dosyası, tam çalışır durumda olan Vakt-i Namaz PWA projesinin tüm kaynak kodlarını içerir.

## 📁 Dosya Yapısı
```
shadcn-ui/
├── package.json              # NPM bağımlılıkları ve scriptler
├── pnpm-lock.yaml           # Paket kilidi
├── index.html               # Ana HTML dosyası
├── vite.config.ts           # Vite konfigürasyonu
├── tailwind.config.ts       # Tailwind CSS konfigürasyonu
├── tsconfig.json            # TypeScript konfigürasyonu
├── eslint.config.js         # ESLint konfigürasyonu
├── postcss.config.js        # PostCSS konfigürasyonu
├── components.json          # shadcn/ui konfigürasyonu
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js               # Service Worker
│   ├── favicon.svg         # Favicon
│   └── robots.txt          # SEO robots
└── src/
    ├── App.tsx             # Ana uygulama bileşeni
    ├── main.tsx            # Giriş noktası
    ├── index.css           # Global stiller
    ├── components/         # UI bileşenleri
    │   ├── ui/            # shadcn/ui bileşenleri (50+ bileşen)
    │   ├── AdPlaceholder.tsx
    │   ├── BottomNavigation.tsx
    │   ├── CountdownTimer.tsx
    │   ├── DailyVerseCard.tsx
    │   ├── PrayerTimeCard.tsx
    │   ├── QiblaCompass.tsx
    │   └── StepChart.tsx
    ├── pages/              # Sayfa bileşenleri
    │   ├── HomePage.tsx
    │   ├── PrayerTimesPage.tsx
    │   ├── QiblaPage.tsx
    │   ├── QuranPage.tsx
    │   ├── StepsPage.tsx
    │   ├── InvitePage.tsx
    │   ├── SettingsPage.tsx
    │   ├── PremiumPage.tsx
    │   └── NotFound.tsx
    ├── store/              # Zustand state yönetimi
    │   ├── userStore.ts
    │   ├── settingsStore.ts
    │   ├── prayerStore.ts
    │   └── stepsStore.ts
    ├── services/           # API servisleri
    │   ├── firebase.ts
    │   ├── prayerTimesService.ts
    │   ├── qiblaService.ts
    │   ├── stepsService.ts
    │   └── notificationsService.ts
    ├── data/               # Dummy veriler
    │   ├── sampleDailyVerses.json
    │   └── sampleSurahs.json
    ├── hooks/              # Custom React hooks
    │   ├── use-mobile.tsx
    │   └── use-toast.ts
    └── lib/
        └── utils.ts        # Yardımcı fonksiyonlar
```

## 🚀 Kurulum ve Çalıştırma

### 1. Projeyi Çıkart
```bash
unzip vakt-namaz-pwa.zip
cd shadcn-ui
```

### 2. Bağımlılıkları Yükle
```bash
# pnpm kullanarak (önerilen)
pnpm install

# veya npm ile
npm install

# veya yarn ile
yarn install
```

### 3. Geliştirme Sunucusunu Başlat
```bash
pnpm run dev
# veya
npm run dev
```

### 4. Production Build
```bash
pnpm run build
# veya
npm run build
```

## ✨ Özellikler

### 🕌 Ana Modüller
1. **Ana Sayfa** - Namaz vakitleri, geri sayım, günün ayeti
2. **Namaz Vakitleri** - Detaylı vakit listesi, alarm sistemi
3. **Kıble Pusulası** - GPS tabanlı kıble yönü
4. **Kur'an Okuma** - Sure listesi, ayet okuma, yer imi
5. **Adım Sayar** - Günlük hedef, haftalık grafik
6. **Davet Sistemi** - Referral kodları, kazanç takibi
7. **Ayarlar** - Tema, şehir, bildirim tercihleri
8. **Premium** - Reklamsız deneyim, özel özellikler

### 📱 PWA Özellikleri
- ✅ Offline çalışma (Service Worker)
- ✅ Ana ekrana ekleme desteği
- ✅ Push notification altyapısı
- ✅ Mobile-first responsive tasarım
- ✅ App-like deneyim

### 🎨 Teknik Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Routing**: React Router
- **Icons**: Lucide React
- **Charts**: Recharts
- **PWA**: Vite PWA Plugin

### 🔧 Entegrasyon Hazırlığı
- **Firebase**: Authentication, Firestore, FCM için iskelet kodlar
- **AdSense**: Reklam placeholder'ları hazır
- **Prayer API**: Aladhan API entegrasyonu için hazır yapı
- **Geolocation**: Konum tabanlı özellikler aktif

## 📋 TODO Listesi
1. **Firebase Konfigürasyonu**
   - `src/services/firebase.ts` dosyasında Firebase config ekle
   - Authentication sistemi aktif et
   - Firestore veritabanı bağlantısı

2. **Gerçek API Entegrasyonları**
   - Aladhan API ile namaz vakitleri
   - Gerçek Kur'an API'si
   - Hava durumu API'si (isteğe bağlı)

3. **AdSense Entegrasyonu**
   - `src/components/AdPlaceholder.tsx` dosyasında gerçek AdSense kodları
   - Reklam yerleşimleri optimize et

4. **Production Optimizasyonları**
   - Environment variables (.env dosyası)
   - Error boundary'ler
   - Performance monitoring

## 🛡️ Güvenlik Notları
- Tüm API anahtarları environment variables ile yönetilmeli
- Firebase security rules dikkatli ayarlanmalı
- HTTPS zorunlu (PWA gereksinimi)

## 📞 Destek
Bu proje MGX platformunda @Alex tarafından geliştirilmiştir.
Herhangi bir sorun için MGX platformunda yeni chat başlatabilirsiniz.

---
**Son Güncelleme**: 2025-11-13
**Versiyon**: 1.0.0
**Lisans**: MIT