interface QiblaData {
  direction: number;
  distance: number;
  isLocationAvailable: boolean;
  error?: string;
}

export class QiblaService {
  private static readonly KAABA_LAT = 21.4225;
  private static readonly KAABA_LNG = 39.8262;

  // -----------------------------
  // PUBLIC: QIBLA CALCULATION
  // -----------------------------
  static async getQiblaDirection(): Promise<QiblaData> {
    try {
      if (!navigator.geolocation) {
        return {
          direction: 0,
          distance: 0,
          isLocationAvailable: false,
          error: "Cihaz konum servisini desteklemiyor."
        };
      }

      const position = await this.getCurrentPosition();
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      const direction = this.calculateQiblaDirection(userLat, userLng);
      const distance = this.calculateDistance(userLat, userLng);

      return {
        direction,
        distance,
        isLocationAvailable: true
      };

    } catch (error: any) {
      let message = "Konum alınamadı.";

      if (error?.code === 1) message = "Konum izni reddedildi.";
      if (error?.code === 2) message = "Konum tespit edilemedi.";
      if (error?.code === 3) message = "Konum isteği zaman aşımına uğradı.";

      return {
        direction: 0,
        distance: 0,
        isLocationAvailable: false,
        error: message
      };
    }
  }

  // -----------------------------
  // GET CURRENT LOCATION
  // -----------------------------
  private static getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      });
    });
  }

  // -----------------------------
  // QIBLA DIRECTION FORMULA (CORRECT)
  // -----------------------------
  private static calculateQiblaDirection(userLat: number, userLng: number): number {
    const lat1 = this.toRad(userLat);
    const lat2 = this.toRad(this.KAABA_LAT);
    const dLng = this.toRad(this.KAABA_LNG - userLng);

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    let bearing = Math.atan2(y, x);
    bearing = this.toDeg(bearing);
    return (bearing + 360) % 360;
  }

  // -----------------------------
  // DISTANCE FORMULA (Haversine)
  // -----------------------------
  private static calculateDistance(userLat: number, userLng: number): number {
    const R = 6371; // Earth KM

    const dLat = this.toRad(this.KAABA_LAT - userLat);
    const dLng = this.toRad(this.KAABA_LNG - userLng);
    const lat1 = this.toRad(userLat);
    const lat2 = this.toRad(this.KAABA_LAT);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  // -----------------------------
  // HELPERS
  // -----------------------------
  private static toRad(d: number) {
    return (d * Math.PI) / 180;
  }

  private static toDeg(r: number) {
    return (r * 180) / Math.PI;
  }
}
