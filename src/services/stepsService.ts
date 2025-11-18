export class StepsService {
  private static instance: StepsService;
  private stepCount: number = 0;
  private isTracking: boolean = false;
  private lastAcceleration: DeviceMotionEventAcceleration | null = null;
  
  static getInstance(): StepsService {
    if (!this.instance) {
      this.instance = new StepsService();
    }
    return this.instance;
  }
  
  // Check if device motion is supported
  isSupported(): boolean {
    return 'DeviceMotionEvent' in window;
  }
  
  // Check current permission status
  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    // TODO: This is a simplified check
    // Real implementation would need to handle different browsers differently
    
    if (!this.isSupported()) {
      return 'denied';
    }
    
    // For iOS 13+ devices, permission is required
    if (typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        return permission === 'granted' ? 'granted' : 'denied';
      } catch (error) {
        return 'denied';
      }
    }
    
    // For other devices, assume granted if supported
    return 'granted';
  }
  
  // Request permission for device motion
  async requestPermission(): Promise<'granted' | 'denied'> {
    if (!this.isSupported()) {
      throw new Error('Device motion is not supported');
    }
    
    if (typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        return permission === 'granted' ? 'granted' : 'denied';
      } catch (error) {
        return 'denied';
      }
    }
    
    return 'granted';
  }
  
  // Start step tracking
  async startTracking(onStepDetected?: (steps: number) => void): Promise<void> {
    if (this.isTracking) return;
    
    const permission = await this.checkPermission();
    if (permission !== 'granted') {
      throw new Error('Permission not granted for device motion');
    }
    
    this.isTracking = true;
    this.stepCount = 0;
    
    // TODO: Implement proper step detection algorithm
    // This is a simplified version for demonstration
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (!this.isTracking) return;
      
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;
      
      // Simple step detection based on acceleration changes
      // Real implementation would need more sophisticated algorithms
      if (this.lastAcceleration) {
        const deltaY = Math.abs((acceleration.y || 0) - (this.lastAcceleration.y || 0));
        
        // Threshold for step detection (simplified)
        if (deltaY > 2) {
          this.stepCount++;
          onStepDetected?.(this.stepCount);
        }
      }
      
      this.lastAcceleration = acceleration;
    };
    
    window.addEventListener('devicemotion', handleDeviceMotion);
    
    console.log('Step tracking started - TODO: Implement proper step detection algorithm');
  }
  
  // Stop step tracking
  stopTracking(): void {
    this.isTracking = false;
    window.removeEventListener('devicemotion', this.handleDeviceMotion);
    console.log('Step tracking stopped');
  }
  
  private handleDeviceMotion = (event: DeviceMotionEvent) => {
    // This will be replaced by the actual handler in startTracking
  };
  
  // Get current step count
  getCurrentSteps(): number {
    return this.stepCount;
  }
  
  // Reset step count
  resetSteps(): void {
    this.stepCount = 0;
  }
  
  // Generate dummy steps for testing
  generateDummySteps(): number {
    return Math.floor(Math.random() * 8000) + 1000; // Random steps between 1000-9000
  }
  
  // Get weekly dummy data
  getWeeklyDummyData(): Array<{ date: string; steps: number }> {
    const weeklyData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      weeklyData.push({
        date: date.toISOString().split('T')[0],
        steps: this.generateDummySteps()
      });
    }
    
    return weeklyData;
  }
}