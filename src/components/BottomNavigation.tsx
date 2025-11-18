import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Clock, 
  Compass, 
  BookOpen, 
  Footprints,
  Users,
  Settings,
  Crown
} from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  isPremium?: boolean;
}

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    {
      path: '/',
      icon: <Home className="h-5 w-5" />,
      label: 'Ana Sayfa'
    },
    {
      path: '/prayer-times',
      icon: <Clock className="h-5 w-5" />,
      label: 'Vakitler'
    },
    {
      path: '/qibla',
      icon: <Compass className="h-5 w-5" />,
      label: 'Kıble'
    },
    {
      path: '/quran',
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Kur\'an'
    },
    {
      path: '/steps',
      icon: <Footprints className="h-5 w-5" />,
      label: 'Adımlar'
    }
  ];

  const secondaryNavItems: NavItem[] = [
    {
      path: '/invite',
      icon: <Users className="h-5 w-5" />,
      label: 'Davet Et'
    },
    {
      path: '/premium',
      icon: <Crown className="h-5 w-5" />,
      label: 'Premium',
      isPremium: true
    },
    {
      path: '/settings',
      icon: <Settings className="h-5 w-5" />,
      label: 'Ayarlar'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <>
      {/* Main Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive(item.path)
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className={`transition-transform ${isActive(item.path) ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className="text-xs font-medium truncate">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Navigation (Floating Action Menu) */}
      <div className="fixed bottom-20 right-4 z-40">
        <div className="flex flex-col space-y-2">
          {secondaryNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all hover:scale-105 ${
                isActive(item.path)
                  ? 'bg-orange-600 text-white'
                  : item.isPremium
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};