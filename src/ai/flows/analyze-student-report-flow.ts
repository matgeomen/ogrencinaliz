
'use server';
/**
 * @fileOverview Öğrenci deneme sınavı sonuçlarını analiz eden bir AI akışı.
 *
 * - analyzeStudentReport - Öğrenci verilerini analiz eden fonksiyon.
 * - AnalyzeStudentReportInput - analyzeStudentReport fonksiyonu için giriş tipi.
 * - AnalyzeStudentReportOutput - analyzeStudentReport fonksiyonu için dönüş tipi.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const KonuAnaliziSchema = z.object({
    konu: z.string(),
    sonuc: z.enum(['D', 'Y', 'B']),
});

const DersAnaliziSchema = z.object({
    dogru: z.number(),
    yanlis: z.number(),
    net: z.number(),
    kazanimlar: z.array(KonuAnaliziSchema),
});

const StudentExamResultSchema = z.object({
    exam_name: z.string(),
    date: z.string(),
    class: z.string(),
    student_no: z.number(),
    student_name: z.string(),
    toplam_dogru: z.number(),
    toplam_yanlis: z.number(),
    toplam_net: z.number(),
    toplam_puan: z.number(),
    turkce: DersAnaliziSchema,
    mat: DersAnaliziSchema,
    fen: DersAnaliziSchema,
    tarih: DersAnaliziSchema,
    din: DersAnaliziSchema,
    ing: DersAnaliziSchema,
});


const AnalyzeStudentReportInputSchema = z.object({
  studentName: z.string().describe('Öğrencinin adı.'),
  className: z.string().describe('Öğrencinin sınıfı.'),
  examName: z.string().describe("Analiz edilen deneme sınavı (veya 'Tüm Denemeler')."),
  examResults: z.array(StudentExamResultSchema).describe("Öğrencinin ilgili deneme sınavı sonuçları."),
});
export type AnalyzeStudentReportInput = z.infer<typeof AnalyzeStudentReportInputSchema>;

const AnalyzeStudentReportOutputSchema = z.object({
  summary: z.string().describe('Öğrencinin genel performansını özetleyen bir giriş paragrafı.'),
  strengths: z.array(z.string()).describe('Öğrencinin güçlü olduğu yönleri ve dersleri/konuları listeleyen maddeler.'),
  areasForImprovement: z.array(z.string()).describe('Öğrencinin gelişmesi gereken alanları ve özellikle zorlandığı konuları listeleyen maddeler.'),
  roadmap: z.array(z.object({
    title: z.string().describe('Yol haritası adımının başlığı.'),
    description: z.string().describe('Yol haritası adımının detaylı açıklaması.'),
  })).describe('Öğrencinin başarısını artırmak için atması gereken somut adımları içeren yol haritası.')
});
export type AnalyzeStudentReportOutput = z.infer<
  typeof AnalyzeStudentReportOutputSchema
>;

export async function analyzeStudentReport(
  input: AnalyzeStudentReportInput
): Promise<AnalyzeStudentReportOutput> {
  
  const formattedResults = input.examResults.map(r => {
    const dersler = [
      `Türkçe: ${r.turkce.net.toFixed(2)}`,
      `Mat: ${r.mat.net.toFixed(2)}`,
      `Fen: ${r.fen.net.toFixed(2)}`,
      `Tarih: ${r.tarih.net.toFixed(2)}`,
      `Din: ${r.din.net.toFixed(2)}`,
      `İng: ${r.ing.net.toFixed(2)}`
    ].join(', ');
    
    const yanlisYapilanKonular = [
      ...r.turkce.kazanimlar, ...r.mat.kazanimlar, ...r.fen.kazanimlar, 
      ...r.tarih.kazanimlar, ...r.din.kazanimlar, ...r.ing.kazanimlar
    ]
    .filter(k => k.sonuc === 'Y')
    .map(k => k.konu)
    .join(', ') || "Yok";

    return `Deneme: ${r.exam_name}, Puan: ${r.toplam_puan.toFixed(2)}, Net: ${r.toplam_net.toFixed(2)} (Ders Netleri: ${dersler}). Yanlış yapılan konular: ${yanlisYapilanKonular}`;
  }).join('\n');

  return analyzeStudentReportFlow({
    studentName: input.studentName,
    className: input.className,
    examName: input.examName,
    examResultsAsText: formattedResults,
  });
}

const PromptInputSchema = z.object({
    studentName: z.string(),
    className: z.string(),
    examName: z.string(),
    examResultsAsText: z.string(),
});

const prompt = ai.definePrompt({
  name: 'analyzeStudentReportPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: AnalyzeStudentReportOutputSchema},
  prompt: `Sen LGS konusunda uzman bir eğitim danışmanısın. Sana verilen öğrenci bilgilerini ve deneme sınavı sonuçlarını (konu detayları dahil) analiz ederek, doğrudan öğrenciye hitap eden, kişisel bir rapor hazırla.

Rapor aşağıdaki gibi yapılandırılmalıdır:
1.  **summary:** Genel akademik performansını, denemeler arasındaki değişimini ve genel potansiyelini özetleyen, motive edici bir giriş paragrafı yaz. Sana verilen metin formatındaki sonuçları yorumlayarak başla. "Sevgili {{{studentName}}}, eldeki verilere göre..." gibi kişisel bir başlangıç yap.
2.  **strengths:** İstikrarlı bir şekilde başarılı olduğun dersleri ve ÖZELLİKLE konu başlıklarını vurgulayan 2-3 maddelik bir liste oluştur. "Matematik dersinde 'Çarpanlar ve Katlar' konusundaki başarın harika!" gibi spesifik ve övücü ol.
3.  **areasForImprovement:** Gelişmesi gereken, netlerinin düşük veya değişken olduğu dersleri ve ÖZELLİKLE yanlış yaptığı spesifik konu başlıklarını tespit eden 2-3 maddelik bir liste oluştur. "Fen Bilimleri dersinde 'Mevsimler ve İklim' konusunda bazı zorluklar yaşadığını görüyoruz. Bu konuyu tekrar etmen faydalı olabilir." gibi yapıcı ve umut verici bir dil kullan. Özellikle LGS'de katsayısı yüksek olan derslerdeki (Matematik, Fen, Türkçe) konu eksiklerine dikkat çek.
4.  **roadmap:** Performansını artırmak için 3-4 adımlık somut ve uygulanabilir bir yol haritası oluştur. Önerilerini, belirlediğin konu eksikliklerine göre kişiselleştir. Her adım için bir 'title' ve 'description' alanı olmalıdır. Başlıklar kısa ve eyleme yönelik olmalı (örn: "Yanlış Yapılan Konulara Odaklan", "Haftalık Tekrar Programı Oluşturma"). Açıklamalar net ve anlaşılır olmalı.

Tüm metinleri profesyonel, yapıcı ve motive edici bir dille yaz.

Öğrenci Bilgileri:
- Ad: {{{studentName}}}
- Sınıf: {{{className}}}
- Analiz Edilen Deneme: {{{examName}}}

Analiz Edilecek Deneme Sonuçları Özeti (Konu Detayları Dahil):
{{{examResultsAsText}}}

Lütfen sadece 'summary', 'strengths', 'areasForImprovement' ve 'roadmap' alanlarını doldurarak bir JSON çıktısı üret.`,
});

const analyzeStudentReportFlow = ai.defineFlow(
  {
    name: 'analyzeStudentReportFlow',
    inputSchema: PromptInputSchema,
    outputSchema: AnalyzeStudentReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
