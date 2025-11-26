import { useUserStore } from "../store/userStore";

export const getGoogleFitSteps = async (): Promise<number> => {
  try {
    const { user } = useUserStore.getState();
    
    if (!user?.googleAccessToken) {
      console.log('❌ Google access token yok');
      return 0;
    }

    console.log('👣 Gerçek Google Fit API çağrısı yapılıyor...');
    console.log('🔑 Token:', user.googleAccessToken.substring(0, 20) + '...');

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000); // 24 saat önce

    // GERÇEK GOOGLE FIT API ÇAĞRISI
    const response = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: "com.google.step_count.delta",
            dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
          }],
          bucketByTime: { durationMillis: 86400000 }, // 1 gün
          startTimeMillis: oneDayAgo,
          endTimeMillis: now
        })
      }
    );

    console.log('📡 API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google Fit API hatası:', response.status, errorText);
      
      if (response.status === 401) {
        console.error('🔐 Token geçersiz veya süresi dolmuş');
      } else if (response.status === 403) {
        console.error('🚫 Google Fit API izni yok');
      }
      
      return 0;
    }

    const data = await response.json();
    console.log('📊 Google Fit API yanıtı:', JSON.stringify(data, null, 2));

    // Adım sayısını çıkar
    let totalSteps = 0;
    
    if (data.bucket && data.bucket.length > 0) {
      for (const bucket of data.bucket) {
        if (bucket.dataset && bucket.dataset.length > 0) {
          for (const dataset of bucket.dataset) {
            if (dataset.point && dataset.point.length > 0) {
              for (const point of dataset.point) {
                if (point.value && point.value.length > 0) {
                  totalSteps += point.value[0].intVal || 0;
                }
              }
            }
          }
        }
      }
    }

    console.log('✅ Gerçek adım verisi alındı:', totalSteps);
    
    if (totalSteps === 0) {
      console.log('ℹ️ Google Fit verisi bulunamadı, kullanıcı adım verisi paylaşmıyor olabilir');
    }
    
    return totalSteps;

  } catch (error) {
    console.error('❌ Google Fit API hatası:', error);
    return 0;
  }
};

// Google Fit bağlantı testi
export const testGoogleFitConnection = async (): Promise<boolean> => {
  try {
    const { user } = useUserStore.getState();
    
    if (!user?.googleAccessToken) {
      console.log('❌ Google Fit bağlantısı yok - token bulunamadı');
      return false;
    }

    // Basit bir test çağrısı
    const steps = await getGoogleFitSteps();
    console.log('🔗 Google Fit bağlantı testi sonucu:', steps !== undefined);
    return steps !== undefined;

  } catch (error) {
    console.error('❌ Google Fit bağlantı testi hatası:', error);
    return false;
  }
};