import React from 'react';

interface AdPlaceholderProps {
  type: 'banner' | 'interstitial' | 'rewarded';
  className?: string;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ type, className = '' }) => {
  // TODO: Replace with real AdSense integration
  
  if (type === 'banner') {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center ${className}`}>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          📢 Reklam Alanı (AdSense)
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          TODO: Google AdSense entegrasyonu
        </div>
      </div>
    );
  }
  
  return null;
};