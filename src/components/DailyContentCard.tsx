import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, Heart, Sparkles } from 'lucide-react';

interface DailyContentProps {
  type: 'verse' | 'hadith' | 'prayer';
  arabic: string;
  turkish: string;
  reference: string;

  // OPSİYONEL
  accentColor?: 'gold' | 'turquoise' | 'soft-gold';
}

export const DailyContentCard: React.FC<DailyContentProps> = ({
  type,
  arabic,
  turkish,
  reference,

  // ❗️DEFAULT PROP DOĞRU KULLANIM
  accentColor = 'soft-gold',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'verse':
        return <Book className="h-5 w-5" />;
      case 'hadith':
        return <Heart className="h-5 w-5" />;
      case 'prayer':
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'verse':
        return 'Günün Ayeti';
      case 'hadith':
        return 'Günün Hadisi';
      case 'prayer':
        return 'Günün Duası';
    }
  };

  const getAccentStyles = () => {
    switch (accentColor) {
      case 'gold':
        return {
          card: 'bg-gradient-to-br from-amber-50/80 to-yellow-50/80 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200/50 dark:border-amber-700/30',
          icon: 'text-amber-600 dark:text-amber-400',
          title: 'text-amber-800 dark:text-amber-200',
          arabic: 'text-amber-900 dark:text-amber-100',
          turkish: 'text-amber-700 dark:text-amber-300',
          reference: 'text-amber-600 dark:text-amber-400',
        };

      case 'turquoise':
        return {
          card: 'bg-gradient-to-br from-teal-50/80 to-cyan-50/80 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200/50 dark:border-teal-700/30',
          icon: 'text-teal-600 dark:text-teal-400',
          title: 'text-teal-800 dark:text-teal-200',
          arabic: 'text-teal-900 dark:text-teal-100',
          turkish: 'text-teal-700 dark:text-teal-300',
          reference: 'text-teal-600 dark:text-teal-400',
        };

      default: // soft-gold
        return {
          card: 'bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200/50 dark:border-orange-700/30',
          icon: 'text-orange-600 dark:text-orange-400',
          title: 'text-orange-800 dark:text-orange-200',
          arabic: 'text-orange-900 dark:text-orange-100',
          turkish: 'text-orange-700 dark:text-orange-300',
          reference: 'text-orange-600 dark:text-orange-400',
        };
    }
  };

  const styles = getAccentStyles();

  return (
    <Card className={`${styles.card} backdrop-blur-sm transition-all duration-300 hover:shadow-md`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center space-x-2 text-lg font-light ${styles.title}`}>
          <span className={styles.icon}>{getIcon()}</span>
          <span>{getTitle()}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ARABIC */}
        <div className="text-right">
          <p className={`text-xl leading-relaxed font-arabic ${styles.arabic}`} dir="rtl">
            {arabic}
          </p>
        </div>

        {/* TURKISH */}
        <p className={`text-base leading-relaxed font-light ${styles.turkish}`}>
          {turkish}
        </p>

        {/* REFERENCE */}
        <div className="pt-2 border-t border-current/10">
          <p className={`text-sm font-light italic ${styles.reference}`}>
            {reference}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
