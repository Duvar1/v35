// src/services/googleFitService.ts

class GoogleFitService {
  private steps = 0;

  async getCurrentSteps(): Promise<number> {
    try {
      // Şimdilik simüle (Google Fit API entegre edildiğinde burası değişecek)
      this.steps += Math.floor(Math.random() * 5) + 1;
      return this.steps;
    } catch (e) {
      console.error("GoogleFitService error:", e);
      return 0;
    }
  }
}

export const googleFitService = new GoogleFitService();
