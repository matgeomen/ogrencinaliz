
'use server';
/**
 * @fileOverview Dosya içeriğini (Excel/JSON veya PDF/metin) analiz edip yapılandırılmış sınav sonucu verisine dönüştüren bir AI akışı.
 *
 * - processExamData - Dosya içeriğini işleyip StudentExamResult dizisi döndüren fonksiyon.
 * - ProcessExamDataInput - processExamData fonksiyonu için giriş tipi.
 * - ProcessExamDataOutput - processExamData fonksiyonu için dönüş tipi.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const KonuAnaliziSchema = z.object({
    konu: z.string().describe("Sorunun ait olduğu konu veya kazanım adı."),
    sonuc: z.enum(['D', 'Y', 'B']).describe("Öğrencinin bu konudaki soruyu Doğru, Yanlış veya Boş olarak yanıtladığını belirtir."),
});

const DersAnaliziSchema = z.object({
    dogru: z.number().describe("Dersteki toplam doğru sayısı."),
    yanlis: z.number().describe("Dersteki toplam yanlış sayısı."),
    net: z.number().describe("Dersteki toplam net sayısı."),
    kazanimlar: z.array(KonuAnaliziSchema).describe("Dersteki her bir konu/kazanım için öğrencinin performansını gösteren liste.")
});

const StudentExamResultSchema = z.object({
    exam_name: z.string().describe("Sınavın adı."),
    date: z.string().describe("Sınavın yapıldığı tarih (YYYY-AA-GG formatında)."),
    class: z.string().describe("Öğrencinin sınıfı."),
    student_no: z.number().describe("Öğrencinin okul numarası."),
    student_name: z.string().describe("Öğrencinin adı ve soyadı."),
    toplam_dogru: z.number().describe("Toplam doğru sayısı."),
    toplam_yanlis: z.number().describe("Toplam yanlış sayısı."),
    toplam_net: z.number().describe("Toplam net sayısı."),
    toplam_puan: z.number().describe("Toplam puan."),
    turkce: DersAnaliziSchema,
    mat: DersAnaliziSchema,
    fen: DersAnaliziSchema,
    tarih: DersAnaliziSchema,
    din: DersAnaliziSchema,
    ing: DersAnaliziSchema,
});

const ProcessExamDataInputSchema = z.object({
  fileContent: z.string().describe('Bir Excel (JSON string olarak) veya PDF (düz metin olarak) dosyasının ham içeriği.'),
  fileName: z.string().describe('İşlenen dosyanın adı. Bu, sınav adını veya tarihini içerebilir.'),
});
export type ProcessExamDataInput = z.infer<typeof ProcessExamDataInputSchema>;

const ProcessExamDataOutputSchema = z.object({
  results: z.array(StudentExamResultSchema).describe("Dosya içeriğinden çıkarılan öğrenci sınav sonuçlarının bir listesi."),
});
export type ProcessExamDataOutput = z.infer<typeof ProcessExamDataOutputSchema>;


export async function processExamData(
  input: ProcessExamDataInput
): Promise<ProcessExamDataOutput> {
  return processExamDataFlow(input);
}


const prompt = ai.definePrompt({
  name: 'processExamDataPrompt',
  input: {schema: ProcessExamDataInputSchema},
  output: {schema: ProcessExamDataOutputSchema},
  system: `Sen bir veri işleme uzmanısın. Görevin, sana verilen bir dosya içeriğini analiz ederek, içindeki öğrenci sınav sonuçlarını, ders ve konu (kazanım) detaylarıyla birlikte yapılandırılmış bir JSON formatına dönüştürmek.

VERİ ANALİZ KURALLARI:
1.  **Kısaltmaları Anla:** Metin içinde geçen 'D', 'd' doğru sayısını; 'Y', 'y' yanlış sayısını; 'B', 'b' boş sayısını; 'N', 'n' ise net sayısını ifade eder. Bu kısaltmaları doğru alanlara ata.
2.  **Tüm Öğrencileri Bul:** Dosya içeriğindeki tüm öğrencilere ait satırları veya bölümleri bul. Her öğrenci için bir JSON nesnesi oluştur.
3.  **Genel Bilgileri Eşleştir:** Metin veya JSON içindeki bilgileri, 'StudentExamResult' şemasındaki genel alanlarla ('exam_name', 'date', 'class', 'student_no', 'student_name', 'toplam_dogru', 'toplam_yanlis', 'toplam_net', 'toplam_puan') eşleştir. Sütun adları farklı olabilir (örn: 'Öğrenci Adı' yerine 'Ad Soyad'). Bu farklılıkları anla ve doğru alanlara ata.
4.  **Ders ve Konu (Kazanım) Analizi:**
    *   Her bir ders (Türkçe, Matematik, Fen, Tarih, Din, İngilizce) için ayrı bir analiz yap.
    *   Eğer içerikte konu/kazanım detayı varsa (örn: "Üslü İfadeler: D", "Sözcükte Anlam: Y"), bu bilgiyi 'kazanimlar' dizisine ekle. Her bir konu için, öğrencinin cevabını 'D' (Doğru), 'Y' (Yanlış), veya 'B' (Boş) olarak 'sonuc' alanına kaydet.
    *   Eğer konu detayı yoksa, 'kazanimlar' dizisini boş bırak.
    *   Her ders için toplam doğru, yanlış ve net sayılarını ilgili ders nesnesindeki ('turkce', 'mat', vb.) 'dogru', 'yanlis', 'net' alanlarına ata. Eğer bu değerler yoksa, kazanım sonuçlarından hesaplamaya çalış.
5.  **Eksik Verileri Yönet:**
    *   Eğer 'exam_name' (sınav adı) içerikte yoksa, bunu dosya adından ({{{fileName}}}) çıkarmaya çalış. Eğer yine bulamazsan, 'Bilinmeyen Sınav' olarak ayarla.
    *   Eğer 'date' (tarih) içerikte yoksa, bugünün tarihini (YYYY-AA-GG formatında) kullan.
    *   Eğer bir ders hiç yoksa (örn: bazı sınavlarda Din Kültürü olmayabilir), o ders için 'dogru', 'yanlis', 'net' değerlerini 0 yap ve 'kazanimlar' dizisini boş bırak.
6.  **Veri Tipi Dönüşümü:** Tüm sayısal alanların number tipinde olduğundan emin ol. Virgüllü sayıları noktaya dönüştür.
7.  **Çıktı Formatı:** Sonuçları, 'results' adında bir anahtarın içinde bir JSON dizisi olarak döndür. Her dizi elemanı, bir öğrencinin sınav sonucunu temsil eden ve 'StudentExamResult' şemasına uyan bir nesne olmalıdır.
`,
  prompt: `ANALİZ EDİLECEK DOSYA BİLGİLERİ:
- Dosya Adı: {{{fileName}}}
- Dosya İçeriği:
{{{fileContent}}}

Lütfen yukarıdaki kurallara göre dosya içeriğini analiz et ve sadece 'results' dizisini içeren bir JSON çıktısı üret.`,
});

const processExamDataFlow = ai.defineFlow(
  {
    name: 'processExamDataFlow',
    inputSchema: ProcessExamDataInputSchema,
    outputSchema: ProcessExamDataOutputSchema,
  },
  async input => {
    // Diagnostic check for API Key
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY env bulunamadı. Lütfen sunucu ortam değişkenlerinizi kontrol edin.");
    }
    if (key.includes("YOUR_") || key.length < 20) {
      throw new Error("GEMINI_API_KEY geçersiz görünüyor. Lütfen doğru bir anahtar girdiğinizden emin olun.");
    }

    const {output} = await prompt(input);
    return output!;
  }
);
    
