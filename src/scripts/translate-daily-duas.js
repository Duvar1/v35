// src/scripts/translate-daily-duas.js - GÜNCELLENMİŞ
import fs from 'fs';
import path from 'path';

// MyMemory Translation API fonksiyonu
async function translateWithMyMemory(text, targetLang = 'tr') {
  try {
    console.log(`🔄 Çeviri başlıyor: "${text.substring(0, 30)}..."`);
    
    // API rate limit için 1 saniye bekle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // API'ye istek gönder
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
    );
    
    // Response kontrolü
    if (!response.ok) {
      throw new Error(`HTTP hatası! status: ${response.status}`);
    }
    
    // JSON verisini al
    const data = await response.json();
    
    // Başarılı çeviri kontrolü
    if (data.responseStatus === 200 && data.responseData) {
      console.log(`✅ Çevrildi: ${data.responseData.translatedText.substring(0, 50)}...`);
      return data.responseData.translatedText;
    } else {
      console.log(`❌ Çevrilemedi: ${text.substring(0, 30)}...`);
      return text;
    }
  } catch (error) {
    console.log(`❌ Hata: ${text.substring(0, 30)}... - ${error.message}`);
    return text;
  }
}

// Önceden çevrilmiş İslami terimler sözlüğü
const preTranslatedTerms = {
  'Words of remembrance for morning and evening': 'Sabah ve Akşam Zikirleri',
  'Remembrance for morning': 'Sabah Zikirleri',
  'Remembrance for evening': 'Akşam Zikirleri',
  'Supplication for anxiety and sorrow': 'Endişe ve Üzüntü Duası',
  'Supplication for distress and grief': 'Sıkıntı ve Keder Duası',
  'Supplication for seeking protection': 'Korunma Duası',
  'Supplication for forgiveness': 'Bağışlanma Duası',
  'Supplication for repentance': 'Tövbe Duası',
  'Supplication for guidance': 'Hidayet Duası',
  'Supplication for patience': 'Sabır Duası',
  'Supplication for gratitude': 'Şükür Duası',
  'Recite': 'Okuyun',
  'Say': 'De ki',
  'Seek refuge': 'Sığınırım',
  'Praise be to Allah': 'Hamd Allah\'a mahsustur',
  'In the name of Allah': 'Allah\'ın adıyla',
  'O Allah': 'Allah\'ım',
  'O Messenger of Allah': 'Ey Allah\'ın Elçisi',
  'He should say': 'Şöyle demelidir',
  'He should also recite': 'Şunu da okumalıdır',
  'He should repeat': 'Tekrarlamalıdır'
};

// Manuel çeviri için örnek dualar
const manualDuaTranslations = {
  'I have believed in Allah and His Messenger.': 'Allah\'a ve Peygamberlerine iman ettim.',
  'He is The First and The Last, Aththahir and Al-Batin and He knows well all things.': 'O, ilk ve son, zahir ve batındır. O, her şeyi bilendir.',
  'O Allah, make what is lawful enough for me, as opposed to what is unlawful, and spare me by Your grace, of need of others.': 'Allah\'ım, helalinden bana yetecek kadar ver, haramından koru. Lütfunla beni başkalarına muhtaç etme.',
  'O Allah, I take refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being over powered by men.': 'Allah\'ım, endişe ve kederden, zayıflık ve tembellikten, cimrilik ve korkaklıktan, borç yükünden ve insanların baskısından sana sığınırım.',
  'That is a devil called Khanzab, so if you sense his presence then seek refuge in Allah from him and spit on your left side three times.': 'Bu, Hanzab adlı bir şeytandır. Onun varlığını hissedersen, Allah\'a sığın ve sol tarafına üç defa tükür.'
};

// Akıllı çeviri fonksiyonu
async function smartTranslate(text) {
  // Boş metin kontrolü
  if (!text || text.trim() === '') {
    return '';
  }
  
  console.log(`🔍 Çeviri öncesi: "${text.substring(0, 50)}..."`);

  // 1. Önceden çevrilmiş terimleri kontrol et
  for (const [english, turkish] of Object.entries(preTranslatedTerms)) {
    if (text === english) {
      console.log(`📚 Sözlükten bulundu: ${turkish}`);
      return turkish;
    }
    if (text.includes(english)) {
      const newText = text.replace(new RegExp(english, 'g'), turkish);
      console.log(`📚 Sözlükten değiştirildi: ${newText.substring(0, 50)}...`);
      text = newText;
    }
  }

  // 2. Manuel dua çevirilerini kontrol et
  for (const [english, turkish] of Object.entries(manualDuaTranslations)) {
    if (text.includes(english)) {
      const newText = text.replace(new RegExp(english, 'g'), turkish);
      console.log(`📖 Manuel çeviri: ${newText.substring(0, 50)}...`);
      text = newText;
    }
  }

  // 3. İngilizce karakter içermeyen metinleri olduğu gibi bırak
  if (!/[a-zA-Z]/.test(text)) {
    console.log(`🔸 İngilizce karakter yok, olduğu gibi bırakıldı`);
    return text;
  }

  // 4. Çok kısa metinleri çevirme
  if (text.length < 3) {
    console.log(`🔸 Çok kısa metin, çevrilmedi`);
    return text;
  }

  // 5. Çok uzun metinleri kısalt
  if (text.length > 500) {
    console.log(`✂️ Uzun metin kısaltıldı`);
    text = text.substring(0, 500);
  }

  // 6. API ile çevir
  console.log(`🌐 API ile çevriliyor...`);
  const translatedText = await translateWithMyMemory(text, 'tr');
  
  return translatedText;
}

// Ana çeviri fonksiyonu
async function translateDailyDuas() {
  try {
    console.log('🚀 Hisn Muslim günlük dualar çevirisi başlıyor...');
    console.log('==========================================');

    // JSON dosya yolları
    const inputPath = path.join(process.cwd(), 'src', 'data', 'hisn-muslim.json');
    const outputPath = path.join(process.cwd(), 'src', 'data', 'daily-duas-turkish.json');

    console.log(`📁 Giriş dosyası: ${inputPath}`);
    console.log(`📁 Çıkış dosyası: ${outputPath}`);

    // Giriş dosyası var mı kontrol et
    if (!fs.existsSync(inputPath)) {
      console.error('❌ HATA: Hisn Muslim JSON dosyası bulunamadı!');
      console.log('📝 Lütfen src/data/hisn-muslim.json dosyasını oluşturun');
      return;
    }

    console.log('✅ Hisn Muslim JSON dosyası bulundu');

    // JSON dosyasını oku
    const fileContent = fs.readFileSync(inputPath, 'utf8');
    const englishData = JSON.parse(fileContent);
    
    console.log('✅ JSON dosyası okundu ve parse edildi');

    // İngilizce kategorileri al
    const englishCategories = englishData.English ? englishData.English : [];
    console.log(`📊 Toplam ${englishCategories.length} kategori bulundu`);

    // Sadece ilk 3 kategoriyi çevir (test için)
    const categoriesToTranslate = englishCategories.slice(0, 3);
    console.log(`🔄 ${categoriesToTranslate.length} kategori çevrilecek...`);

    // Çevrilmiş veri structure'ı
    const translatedData = {
      Turkish: []
    };

    // Her kategoriyi çevir
    for (let categoryIndex = 0; categoryIndex < categoriesToTranslate.length; categoryIndex++) {
      const englishCategory = categoriesToTranslate[categoryIndex];
      
      console.log(`\n📚 Kategori ${categoryIndex + 1}/${categoriesToTranslate.length}: ${englishCategory.TITLE}`);
      console.log('------------------------------------------');

      // Kategori başlığını çevir
      const translatedTitle = await smartTranslate(englishCategory.TITLE);
      
      // Çevrilmiş kategori objesi
      const translatedCategory = {
        ID: englishCategory.ID,
        TITLE: translatedTitle,
        AUDIO_URL: englishCategory.AUDIO_URL || '',
        TEXT: []
      };

      // Kategori içindeki duaları çevir
      if (englishCategory.TEXT && Array.isArray(englishCategory.TEXT)) {
        console.log(`   📖 ${englishCategory.TEXT.length} dua çevrilecek...`);
        
        // Sadece ilk 2 duayı çevir (test için)
        const duasToTranslate = englishCategory.TEXT.slice(0, 2);
        
        for (let duaIndex = 0; duaIndex < duasToTranslate.length; duaIndex++) {
          const englishDua = duasToTranslate[duaIndex];
          
          console.log(`      📝 Dua ${duaIndex + 1}/${duasToTranslate.length} (ID: ${englishDua.ID})`);
          
          // Her dua alanını çevir
          const translatedArabicText = englishDua.ARABIC_TEXT || '';
          const translatedLangArabicText = await smartTranslate(englishDua.LANGUAGE_ARABIC_TRANSLATED_TEXT || '');
          const translatedText = await smartTranslate(englishDua.TRANSLATED_TEXT || '');
          
          // Çevrilmiş dua objesi
          const translatedDua = {
            ID: englishDua.ID,
            ARABIC_TEXT: translatedArabicText,
            LANGUAGE_ARABIC_TRANSLATED_TEXT: translatedLangArabicText,
            TRANSLATED_TEXT: translatedText,
            REPEAT: englishDua.REPEAT || 1,
            AUDIO: englishDua.AUDIO || ''
          };
          
          translatedCategory.TEXT.push(translatedDua);
          console.log(`      ✅ Dua ${duaIndex + 1} çevrildi`);
        }
      } else {
        console.log(`   ℹ️  Bu kategoride dua bulunamadı`);
      }

      // Çevrilmiş kategoriyi ekle
      translatedData.Turkish.push(translatedCategory);
      console.log(`✅ Kategori tamamlandı: ${translatedTitle}`);
    }

    // Çevrilmiş veriyi JSON'a dönüştür
    const jsonOutput = JSON.stringify(translatedData, null, 2);
    
    console.log('\n📝 JSON yazılıyor...');
    console.log(`JSON uzunluğu: ${jsonOutput.length} karakter`);
    
    // JSON geçerli mi kontrol et
    try {
      JSON.parse(jsonOutput);
      console.log('✅ Çevrilmiş JSON geçerli');
    } catch (jsonError) {
      console.error('❌ Çevrilmiş JSON geçersiz:', jsonError);
      return;
    }

    // Çevrilmiş veriyi dosyaya yaz
    console.log(`📁 Dosyaya yazılıyor: ${outputPath}`);
    fs.writeFileSync(outputPath, jsonOutput, 'utf8');
    
    // Dosyanın yazıldığını kontrol et
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`✅ Dosya yazıldı! Boyut: ${stats.size} bytes`);
      
      // Dosya içeriğini kontrol et
      const writtenContent = fs.readFileSync(outputPath, 'utf8');
      console.log(`📄 Dosya içeriği uzunluğu: ${writtenContent.length} karakter`);
      
      if (writtenContent.length > 0) {
        console.log('🎉 DOSYA BAŞARIYLA OLUŞTURULDU!');
      } else {
        console.log('❌ DOSYA BOŞ! Bir sorun var.');
      }
    } else {
      console.log('❌ DOSYA OLUŞTURULAMADI!');
    }
    
    console.log('\n🎉 ÇEVİRİ TAMAMLANDI!');
    console.log('==========================================');
    console.log(`📊 Toplam: ${translatedData.Turkish.length} kategori çevrildi`);
    console.log(`🌐 Çeviri API: MyMemory Translate`);

  } catch (error) {
    console.error('\n❌ CRITICAL HATA:', error);
    console.error('Hata detayı:', error.message);
  }
}

// Script başlangıcı
console.log('✨ Günlük Dualar Çeviri Scripti');
console.log('⏰ Başlatılıyor...\n');

// Script'i çalıştır
await translateDailyDuas();

// Script sonu
console.log('\n🏁 Script sonlandırıldı');