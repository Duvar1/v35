import React from 'react';
import { QiblaCompass } from '../components/QiblaCompass';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { useUserStore } from '../store/userStore';

export const QiblaPage: React.FC = () => {
  const { user } = useUserStore();

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950 p-4 pb-28 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Kıble Pusulası 🕋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Kâbe yönünü bulmak için konumunuzu paylaşın
        </p>
      </div>

      {/* Top Ad */}
      {!user?.isPremium && (
        <AdPlaceholder 
          type="banner" 
          className="max-w-md mx-auto border border-blue-200 dark:border-blue-900 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md" 
        />
      )}

      {/* Qibla Compass */}
      <QiblaCompass />

      {/* Bottom Ad */}
      {!user?.isPremium && (
        <AdPlaceholder 
          type="banner" 
          className="max-w-md mx-auto border border-blue-200 dark:border-blue-900 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md" 
        />
      )}
    </div>
  );
};

// Default export da ekleyelim
export default QiblaPage;