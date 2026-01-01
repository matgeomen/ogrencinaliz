'use server';
/**
 * @fileOverview Dosya içeriğini (Excel/JSON veya PDF/metin) analiz edip yapılandırılmış sınav sonucu verisine dönüştüren bir AI akışı.
 *
 * - processExamData - Dosya içeriğini işleyip StudentExamResult dizisi döndüren fonksiyon.
 * - ProcessExamDataInput - processExamData fonksiyonu için giriş tipi.
 * - ProcessExamDataOutput - processExamData fonksiyonu için dönüş tipi.
 */

import { ai } from '@/ai/genkit';
import { StudentExamResult } from '@/types';
import { z } from 'genkit';

// types/index.ts dosyasındaki StudentExamResult ile tutarlı olmalı
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
    turkce_d: z.number().optional().default(0),
    turkce_y: z.number().optional().default(0),
    turkce_net: z.number().describe("Türkçe dersi neti."),
    tarih_d: z.number().optional().default(0),
    tarih_y: z.number().optional().default(0),
    tarih_net: z.number().describe("T.C. İnkılap Tarihi ve Atatürkçülük dersi neti."),
    din_d: z.number().optional().default(0),
    din_y: z.number().optional().default(0),
    din_net: z.number().describe("Din Kültürü ve Ahlak Bilgisi dersi neti."),
    ing_d: z.number().optional().default(0),
    ing_y: z.number().optional().default(0),
    ing_net: z.number().describe("İngilizce dersi neti."),
    mat_d: z.number().optional().default(0),
    mat_y: z.number().optional().default(0),
    mat_net: z.number().describe("Matematik dersi neti."),
    fen_d: z.number().optional().default(0),
    fen_y: z.number().optional().default(0),
    fen_net: z.number().describe("Fen Bilimleri dersi neti."),
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
  prompt: `Sen bir veri işleme uzmanısın. Görevin, sana verilen bir dosya içeriğini analiz ederek, içindeki öğrenci sınav sonuçlarını yapılandırılmış bir JSON formatına dönüştürmek.

VERİ ANALİZ KURALLARI:
1.  **Tüm Öğrencileri Bul:** Dosya içeriğindeki tüm öğrencilere ait satırları veya bölümleri bul. Her öğrenci için bir JSON nesnesi oluştur.
2.  **Alanları Eşleştir:** Sana verilen metin veya JSON içindeki bilgileri, aşağıdaki 'StudentExamResult' şemasındaki alanlarla eşleştir. Sütun adları farklı olabilir (örn: 'Öğrenci Adı' yerine 'Ad Soyad', 'turkce_net' yerine 'Türkçe Net'). Bu farklılıkları anla ve doğru alanlara ata.
3.  **Eksik Verileri Yönet:**
    *   Eğer 'exam_name' (sınav adı) içerikte yoksa, bunu dosya adından ({{{fileName}}}) çıkarmaya çalış. Eğer yine bulamazsan, 'Bilinmeyen Sınav' olarak ayarla.
    *   Eğer 'date' (tarih) içerikte yoksa, bugünün tarihini (YYYY-AA-GG formatında) kullan.
    *   Eğer 'class' (sınıf) yoksa, 'N/A' olarak ayarla.
    *   Doğru (örn: turkce_d) ve yanlış (örn: turkce_y) sayıları yoksa, bu alanları 0 olarak bırak ama net alanını mutlaka doldur.
    *   Eğer bir dersin neti yoksa (örn: 'tarih_net'), onu 0 olarak ayarla. Özellikle 'tarih', 'din', 'ing' gibi dersler bazen olmayabilir.
4.  **Veri Tipi Dönüşümü:** Tüm sayısal alanların (puan, net, doğru, yanlış sayıları) number tipinde olduğundan emin ol. Virgüllü sayıları noktaya dönüştür.
5.  **Çıktı Formatı:** Sonuçları, 'results' adında bir anahtarın içinde bir JSON dizisi olarak döndür. Her dizi elemanı, bir öğrencinin sınav sonucunu temsil eden ve 'StudentExamResult' şemasına uyan bir nesne olmalıdır.

ÖRNEK GİRDİ (EXCEL'DEN JSON'A):
'[{"Sınav Adı": "Deneme 1", "Tarih": "2024-05-20", "Sınıf": "8A", "No": 123, "Ad Soyad": "Ali Veli", "Toplam Net": 75.5, "Puan": 450.7, "Türkçe N.": 18.5, "Mat N.": 15, ...}]'

ÖRNEK GİRDİ (PDF'TEN METİN):
"LGS Deneme Sınavı Sonuçları - 21.05.2024
8-A Sınıfı
101 Ayşe Yılmaz   Türkçe: 17.33 Mat: 12.00 Fen: 18.67 ... Toplam Puan: 412.50
102 Veli Can      Türkçe: 15.00 Mat: 19.33 Fen: 17.00 ... Toplam Puan: 460.00"

ANALİZ EDİLECEK DOSYA BİLGİLERİ:
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
    // İçeriğin çok uzun olmasını engellemek için bir kısmını alabiliriz,
    // ancak şimdilik tam içeriği gönderiyoruz. Gerekirse burada kırpma yapılabilir.
    const MAX_LENGTH = 20000;
    if (input.fileContent.length > MAX_LENGTH) {
        input.fileContent = input.fileContent.substring(0, MAX_LENGTH);
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);
