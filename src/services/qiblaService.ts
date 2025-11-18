interface QiblaData {
  direction: number; // Degrees from North
  distance: number; // Distance to Kaaba in KM
  isLocationAvailable: boolean;
  error?: string;
}

export class QiblaService {
  // Kaaba coordinates
  private static readonly KAABA_LAT = 21.4225;
  private static readonly KAABA_LNG = 39.8262;
  
  static async getQiblaDirection(): Promise<QiblaData> {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        return {
          direction: 0,
          distance: 0,
          isLocationAvailable: false,
          error: 'Geolocation is not supported by this browser.'
        };
      }
      
      // Get user's current position
      const position = await this.getCurrentPosition();
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      
      // Calculate Qibla direction
      const direction = this.calculateQiblaDirection(userLat, userLng);
      const distance = this.calculateDistance(userLat, userLng);
      
      return {
        direction,
        distance,
        isLocationAvailable: true
      };
      
    } catch (error) {
      return {
        direction: 0,
        distance: 0,
        isLocationAvailable: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  private static getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }
  
  private static calculateQiblaDirection(userLat: number, userLng: number): number {
    // Convert degrees to radians
    const lat1 = this.toRadians(userLat);
    const lat2 = this.toRadians(this.KAABA_LAT);
    const deltaLng = this.toRadians(this.KAABA_LNG - userLng);
    
    // Calculate bearing using formula
    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    
    let bearing = Math.atan2(y, x);
    
    // Convert to degrees and normalize to 0-360
    bearing = this.toDegrees(bearing);
    bearing = (bearing + 360) % 360;
    
    return Math.round(bearing);
  }
  
  private static calculateDistance(userLat: number, userLng: number): number {
    const R = 6371; // Earth's radius in kilometers
    
    const lat1 = this.toRadians(userLat);
    const lat2 = this.toRadians(this.KAABA_LAT);
    const deltaLat = this.toRadians(this.KAABA_LAT - userLat);
    const deltaLng = this.toRadians(this.KAABA_LNG - userLng);
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return Math.round(R * c);
  }
  
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  private static toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
  
  // TODO: Add device orientation API for real compass functionality
  static async getDeviceOrientation(): Promise<number | null> {
    // This would require DeviceOrientationEvent API
    // For now, return null as placeholder
    return null;
  }
}