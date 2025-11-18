# Vakt-i Namaz PWA - Development Plan

## MVP Features (8 Modules)

### 1. Ana Ekran (Main Screen)
- Prayer times list for today (5 prayers)
- Active prayer countdown timer
- Daily verse card (dummy data)
- Selected city display
- AdSense placeholder component

### 2. Namaz Vakitleri Sayfası (Prayer Times Page)
- List of 5 daily prayers with times
- Alarm on/off switches for each prayer
- Basic notification settings
- Firebase Cloud Messaging skeleton

### 3. Kıble Pusulası (Qibla Compass)
- Simple compass visual/SVG
- Qibla direction arrow
- Geolocation API integration
- Math calculation for Qibla direction

### 4. Kur'an Okuma (Quran Reading)
- Surah list with verse counts
- Simple verse reading interface
- Bookmark system (star icons)
- localStorage for bookmarks

### 5. Adım Sayar (Step Counter)
- Daily step display (dummy data)
- Daily goal tracking
- Weekly bar chart
- DeviceMotion API skeleton

### 6. Davet Sistemi (Referral System)
- User referral code generation
- Share functionality
- Simple earnings display
- Firestore integration

### 7. Ayarlar (Settings)
- Light/Dark theme toggle
- City selection
- Notification preferences
- localStorage for settings

### 8. Premium System
- isPremium flag management
- Ad display control
- Test premium button
- Payment system placeholder

## Technical Stack
- React + TypeScript + Vite
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- Firebase (Auth, Firestore, FCM)
- PWA with service worker
- AdSense placeholder components

## File Structure
- `/src/pages/` - 8 main pages
- `/src/components/` - Reusable UI components
- `/src/hooks/` - Custom hooks
- `/src/store/` - Zustand stores
- `/src/services/` - Firebase and API services
- `/src/data/` - Dummy JSON data
- `/src/pwa/` - PWA configuration