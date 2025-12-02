// Basit bir ücretsiz Google Translate hack'i
async function translateToTurkish(text: string): Promise<string> {
  try {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=" +
      encodeURIComponent(text);

    const res = await fetch(url);
    const data = await res.json();
    return data[0]?.map((t: any) => t[0]).join("") || text;
  } catch {
    return text; // Çeviri başarısızsa İngilizce bırak
  }
}

export async function fetchDailyHadith() {
  try {
    const res = await fetch("/data/sahih-muslim.json");
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const today = Math.floor(Date.now() / 86400000);
    const index = today % data.length;
    const item = data[index];

    // İngilizce metni Türkçeye çevir 🔥
    const turkishExplanation = await translateToTurkish(item.English_Text);

    return {
      hadeeth: item.Arabic_Text,
      explanation: turkishExplanation,
      reference: item.Reference ?? "Sahih Muslim",
    };

  } catch (err) {
    console.log("Hadis HATA:", err);
    return null;
  }
}
