import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, Heart, Star, Sun } from 'lucide-react';

interface DailyVerse {
  id: number;
  text: string;
  source: string;
  category: string;
}

interface DailyVerseCardProps {
  verse?: DailyVerse;
}

const getIcon = (category: string) => {
  switch (category) {
    case 'sabır':
      return <Heart className="h-5 w-5 text-red-500" />;
    case 'dua':
      return <Star className="h-5 w-5 text-yellow-500" />;
    case 'şükür':
      return <Sun className="h-5 w-5 text-orange-500" />;
    default:
      return <Book className="h-5 w-5 text-blue-500" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'sabır':
      return 'from-red-50 to-pink-50 dark:from-red-900 dark:to-pink-900';
    case 'dua':
      return 'from-yellow-50 to-amber-50 dark:from-yellow-900 dark:to-amber-900';
    case 'şükür':
      return 'from-orange-50 to-yellow-50 dark:from-orange-900 dark:to-yellow-900';
    default:
      return 'from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900';
  }
};

// Default verse in case none is provided
const defaultVerse: DailyVerse = {
  id: 1,
  text: "Ve O'na tevekkül eden kimselere Allah yeter. Şüphesiz Allah, her şeyi bir ölçüye göre yapmıştır.",
  source: "Talak Suresi, 3. Ayet",
  category: "tevekkül"
};

export const DailyVerseCard: React.FC<DailyVerseCardProps> = ({ verse }) => {
  // Use provided verse or fallback to default
  const displayVerse = verse || defaultVerse;
  
  // Ensure verse has required properties
  const safeVerse = {
    id: displayVerse.id || 1,
    text: displayVerse.text || defaultVerse.text,
    source: displayVerse.source || defaultVerse.source,
    category: displayVerse.category || defaultVerse.category
  };

  return (
    <Card className={`bg-gradient-to-br ${getCategoryColor(safeVerse.category)} border-0 shadow-lg`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          {getIcon(safeVerse.category)}
          <span className="text-gray-800 dark:text-gray-200">Günün Ayeti</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-right">
          <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 font-medium mb-4">
            "{safeVerse.text}"
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {safeVerse.source}
          </p>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
              {safeVerse.category}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            #{safeVerse.id}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};