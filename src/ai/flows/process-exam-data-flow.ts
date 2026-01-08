// src/ai/flows/process-exam-data-flow.ts
// Fetch API kullanarak - Ekstra paket gerektirmez

interface ProcessExamDataInput {
  fileName: string;
  fileContent: string;
}

interface ExamResult {
  examName: string;
  results: StudentExamResult[];
}

interface StudentExamResult {
  studentName: string;
  studentNo: string;
  class: string;
  totalScore: number;
  totalNet: number;
  subjects: {
    [key: string]: {
      correct: number;
      wrong: number;
      empty: number;
      net: number;
    };
  };
}

// API anahtarını localStorage'dan al
function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  
  // Context tarafından kullanılan key ismi: gemini_api_key
  const apiKey = localStorage.getItem('gemini_api_key');
  
  if (!apiKey) {
    console.error('API Key bulunamadı. Lütfen Ayarlar sayfasından API anahtarınızı kaydedin.');
  }
  
  return apiKey || '';
}

// Metni parçalara böl (chunking)
function chunkText(text: string, maxChunkSize: number = 8000): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';

  // Satır satır işle
  const lines = text.split('\n');

  for (const line of lines) {
    if ((currentChunk + line).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += line + '\n';
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Gemini API çağrısı (Fetch ile) - Birden fazla model adını dene
async function callGeminiAPI(
  apiKey: string,
  prompt: string
): Promise<string> {
  // Farklı model adlarını sırayla dene
  const modelNames = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-pro-latest', 
    'gemini-1.5-pro',
    'gemini-pro',
    'models/gemini-1.5-flash-latest',
    'models/gemini-pro'
  ];

  let lastError: any = null;

  for (const modelName of modelNames) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error('API yanıt vermedi');
        }

        console.log(`✅ Başarılı model: ${modelName}`);
        return data.candidates[0].content.parts[0].text;
      }

      // 404 değilse (örn. 403, 429), hatayı fırlat
      if (response.status !== 404) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 403 || response.status === 400) {
          throw new Error(
            'API anahtarı geçersiz veya yetkisiz. Lütfen Ayarlar sayfasından geçerli bir API anahtarı girin.'
          );
        }
        
        if (response.status === 429) {
          throw new Error(
            'API kota limiti aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.'
          );
        }

        throw new Error(
          `API hatası (${response.status}): ${errorData.error?.message || 'Bilinmeyen hata'}`
        );
      }

      // 404 ise bir sonraki model adını dene
      console.log(`❌ Model bulunamadı: ${modelName}`);
      lastError = new Error(`404: Model ${modelName} bulunamadı`);
      
    } catch (error: any) {
      lastError = error;
      
      // 404 dışındaki hataları hemen fırlat
      if (!error.message?.includes('404') && response.status !== 404) {
        throw error;
      }
    }
  }

  // Tüm model isimleri denendi, hiçbiri çalışmadı
  throw new Error(
    'Gemini modeli bulunamadı. API anahtarınızın geçerli olduğundan ve Google AI Studio\'dan (aistudio.google.com) oluşturulduğundan emin olun.'
  );
}

// Tek bir chunk'ı işle
async function processChunk(
  apiKey: string,
  chunk: string,
  fileName: string,
  chunkIndex: number,
  totalChunks: number
): Promise<any> {
  const prompt = `
Sen bir sınav sonuçları analiz asistanısın. Verilen dosya içeriğinden öğrenci sınav sonuçlarını çıkar.

Dosya Adı: ${fileName}
${totalChunks > 1 ? `Parça ${chunkIndex + 1}/${totalChunks}` : ''}

İçerik:
${chunk}

GÖREV:
Bu içerikten şu bilgileri çıkar:
- Sınav Adı
- Öğrenci Adı
- Öğrenci Numarası
- Sınıf
- Toplam Puan
- Toplam Net
- Ders Netleri (Türkçe, Matematik, Fen, Sosyal, İngilizce vb.)

ÇIKTI FORMATI (sadece JSON döndür, başka açıklama ekleme):
{
  "examName": "Sınav Adı",
  "students": [
    {
      "studentName": "Ad Soyad",
      "studentNo": "Numara",
      "class": "Sınıf",
      "totalScore": 0,
      "totalNet": 0,
      "subjects": {
        "Türkçe": { "correct": 0, "wrong": 0, "empty": 0, "net": 0 },
        "Matematik": { "correct": 0, "wrong": 0, "empty": 0, "net": 0 }
      }
    }
  ]
}

ÖNEMLI:
- Eğer içerikte öğrenci verisi yoksa boş students dizisi döndür: {"examName": "", "students": []}
- Sadece JSON formatında cevap ver
- Sayısal değerler number tipinde olmalı
`;

  const text = await callGeminiAPI(apiKey, prompt);

  // JSON'u temizle ve parse et
  const jsonText = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('JSON parse hatası:', error);
    console.log('AI cevabı:', text);
    throw new Error('AI yanıtı geçerli JSON formatında değil');
  }
}

// Ana işleme fonksiyonu
export async function processExamData(
  input: ProcessExamDataInput,
  onProgress?: (message: string) => void
): Promise<ExamResult> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('API anahtarı bulunamadı. Lütfen Ayarlar sayfasından API anahtarınızı girin ve kaydedin.');
  }

  const { fileName, fileContent } = input;

  // Dosya boyutunu kontrol et
  const fileSizeKB = new Blob([fileContent]).size / 1024;
  console.log(`Dosya boyutu: ${fileSizeKB.toFixed(2)} KB`);

  onProgress?.('Dosya içeriği analiz ediliyor...');

  // Büyük dosyalar için chunking
  const MAX_CHUNK_SIZE = 8000; // ~8KB per chunk
  const chunks = chunkText(fileContent, MAX_CHUNK_SIZE);

  console.log(`Toplam ${chunks.length} parçaya bölündü`);

  let allStudents: any[] = [];
  let examName = '';

  // Her chunk'ı sırayla işle
  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(`Parça ${i + 1}/${chunks.length} işleniyor...`);

    try {
      const chunkResult = await processChunk(
        apiKey,
        chunks[i],
        fileName,
        i,
        chunks.length
      );

      if (chunkResult.examName && !examName) {
        examName = chunkResult.examName;
      }

      if (chunkResult.students && Array.isArray(chunkResult.students)) {
        allStudents = allStudents.concat(chunkResult.students);
      }

      // Rate limiting için kısa bekleme
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      console.error(`Chunk ${i + 1} işlenirken hata:`, error);
      
      // Diğer hatalar için devam et (bazı chunk'lar veri içermeyebilir)
      if (i === chunks.length - 1 && allStudents.length === 0) {
        throw error;
      }
    }
  }

  onProgress?.('Sonuçlar birleştiriliyor...');

  // Sonuçları birleştir ve düzenle
  const results: StudentExamResult[] = allStudents.map((student: any) => ({
    studentName: student.studentName || '',
    studentNo: String(student.studentNo || ''),
    class: student.class || '',
    totalScore: Number(student.totalScore || 0),
    totalNet: Number(student.totalNet || 0),
    subjects: student.subjects || {},
  }));

  if (results.length === 0) {
    throw new Error('Dosyada öğrenci verisi bulunamadı');
  }

  console.log(`Toplam ${results.length} öğrenci verisi işlendi`);

  return {
    examName: examName || fileName.replace(/\.(xlsx|pdf)$/i, ''),
    results,
  };
}

// Retry mekanizması ile işleme (opsiyonel)
export async function processExamDataWithRetry(
  input: ProcessExamDataInput,
  onProgress?: (message: string) => void,
  maxRetries: number = 2
): Promise<ExamResult> {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    try {
      return await processExamData(input, onProgress);
    } catch (error: any) {
      lastError = error;
      attempt++;

      // API key hatası veya model bulunamadı hatası için tekrar deneme
      if (
        error.message?.toLowerCase().includes('api key') ||
        error.message?.toLowerCase().includes('not found') ||
        error.message?.toLowerCase().includes('geçersiz') ||
        error.message?.toLowerCase().includes('bulunamadı')
      ) {
        throw error; // Bu hataları hemen fırlat
      }

      if (attempt < maxRetries) {
        onProgress?.(`Hata oluştu, tekrar deneniyor (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  throw lastError || new Error('İşlem başarısız oldu');
}
