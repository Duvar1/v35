// src/services/hadithService.ts

const HADITH_API_BASE_URL = "https://hadeethenc.com/api/v1"; 

// ... fetchHadithCategories ve fetchHadithsByCategory tanımları ...

export async function fetchDailyRandomHadith(): Promise<any> {
    const CATEGORY_ID = "5"; // Faziletler ve Adaplar
    const MAX_HADEETHS = 690; // Toplam Hadis sayısı (Sizin API yanıtınızdan)
    const PER_PAGE = 20;
    const MAX_PAGE = Math.ceil(MAX_HADEETHS / PER_PAGE);

    // 1. Rastgele bir sayfa seç (1'den MAX_PAGE'e kadar)
    const randomPage = Math.floor(Math.random() * MAX_PAGE) + 1;

    // 2. Rastgele sayfadaki Hadis listesini çek
    const listUrl = `${HADITH_API_BASE_URL}/hadeeths/list?language=tr&category_id=${CATEGORY_ID}&page=${randomPage}&per_page=${PER_PAGE}`;
    
    const listResponse = await fetch(listUrl);
    if (!listResponse.ok) throw new Error("Hadis listesi yüklenirken hata oluştu.");
    const listData = await listResponse.json();

    if (!listData.data || listData.data.length === 0) {
        throw new Error("Rastgele sayfada Hadis bulunamadı.");
    }

    // 3. Listeden rastgele bir Hadis ID'si seç
    const randomHadithIndex = Math.floor(Math.random() * listData.data.length);
    const selectedHadithId = listData.data[randomHadithIndex].id;

    // 4. Seçilen Hadis'in detaylarını çek
    const detailUrl = `${HADITH_API_BASE_URL}/hadeeths/one/?hadeeth_id=${selectedHadithId}&language=tr`;
    
    const detailResponse = await fetch(detailUrl);
    if (!detailResponse.ok) throw new Error("Hadis detayı yüklenirken hata oluştu.");
    
    return await detailResponse.json(); 
}