import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, AlertCircle, RefreshCw, Compass } from 'lucide-react';
import { QiblaService } from '../services/qiblaService';

interface QiblaData {
  direction: number;
  distance: number;
  isLocationAvailable: boolean;
  error?: string;
}

export const QiblaCompass: React.FC = () => {
  const [qiblaData, setQiblaData] = useState<QiblaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [hasCompass, setHasCompass] = useState(false);

  const arrowRef = useRef<HTMLDivElement>(null);

  const findQibla = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await QiblaService.getQiblaDirection();
      setQiblaData(data);
      
      if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Pusula yönünü dinle
  useEffect(() => {
    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setCompassHeading(event.alpha);
        setHasCompass(true);
        
        // Pusula iğnesini güncelle
        if (arrowRef.current && qiblaData?.isLocationAvailable) {
          const heading = event.alpha; // 0-360 derece
          const qiblaDirection = qiblaData.direction;
          
          // Kıble yönünü pusulaya göre hesapla
          const rotation = (360 - heading + qiblaDirection) % 360;
          arrowRef.current.style.transform = `rotate(${rotation}deg)`;
        }
      }
    };

    // iOS için izin iste
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
          }
        })
        .catch(() => {
          console.log('Pusula izni reddedildi');
        });
    } else if (window.DeviceOrientationEvent) {
      // Diğer cihazlar
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [qiblaData]);

  useEffect(() => {
    findQibla();
  }, []);

  // Pusula kalibrasyonu
  const calibrateCompass = () => {
    if (arrowRef.current) {
      arrowRef.current.style.transition = 'transform 0.3s ease';
      setTimeout(() => {
        if (arrowRef.current) {
          arrowRef.current.style.transition = 'transform 0.1s ease';
        }
      }, 300);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700">
        <CardContent className="p-6">
          {/* Compass Container */}
          <div className="relative w-64 h-64 mx-auto mb-6">
            {/* Compass Circle */}
            <div className="absolute inset-0 rounded-full border-4 border-green-300 dark:border-green-600 bg-white dark:bg-gray-800 shadow-lg">
              {/* Cardinal Directions */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-sm font-bold text-gray-700 dark:text-gray-300">
                K
              </div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm font-bold text-gray-700 dark:text-gray-300">
                G
              </div>
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm font-bold text-gray-700 dark:text-gray-300">
                B
              </div>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm font-bold text-gray-700 dark:text-gray-300">
                D
              </div>
              
              {/* Degree Markings */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((degree) => (
                <div
                  key={degree}
                  className={`absolute top-1/2 left-1/2 origin-bottom transform -translate-x-1/2 -translate-y-full 
                    ${degree % 90 === 0 ? 'h-4 w-1' : 'h-3 w-0.5'} bg-gray-400`}
                  style={{ transform: `translate(-50%, -100%) rotate(${degree}deg)` }}
                />
              ))}
              
              {/* Center Point */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 border-2 border-yellow-400 rounded-sm transform rotate-45"></div>
                </div>
              </div>
              
              {/* Qibla Direction Arrow */}
              {qiblaData?.isLocationAvailable && (
                <div 
                  ref={arrowRef}
                  className="absolute top-1/2 left-1/2 origin-bottom transform -translate-x-1/2 -translate-y-full transition-transform duration-100"
                  style={{ height: '90px' }}
                >
                  <Navigation className="h-10 w-10 text-red-600 dark:text-red-400 drop-shadow-lg" />
                </div>
              )}
            </div>

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
          
          {/* Status Information */}
          <div className="text-center space-y-3">
            {loading && (
              <p className="text-gray-600 dark:text-gray-400">Konum alınıyor...</p>
            )}
            
            {error && (
              <div className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            
            {qiblaData?.isLocationAvailable && (
              <div className="space-y-2">
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                  Kıble Yönü: {qiblaData.direction}°
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kâbe'ye uzaklık: {qiblaData.distance.toLocaleString()} km
                </p>
                {hasCompass && compassHeading !== null && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pusula: {Math.round(compassHeading)}°
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 justify-center mt-4">
            <Button 
              onClick={findQibla} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white flex-1 max-w-xs"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Alınıyor...' : 'Yenile'}
            </Button>
            
            <Button 
              onClick={calibrateCompass}
              variant="outline"
              className="flex-1 max-w-xs"
            >
              <Compass className="h-4 w-4 mr-2" />
              Kalibre Et
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center">
            <Compass className="h-4 w-4 mr-2" />
            Kullanım Talimatları:
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Cihazınızı düz bir yüzeye yerleştirin
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Konum izni verin
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Kırmızı ok Kıble yönünü gösterir
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Kalibrasyon için cihazınızı 8 şeklinde hareket ettirin
            </li>
            {!hasCompass && (
              <li className="flex items-start text-amber-600 dark:text-amber-400">
                <span className="mr-2">•</span>
                Pusula desteklenmiyor - sadece sabit yön gösterilir
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};