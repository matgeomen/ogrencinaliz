'use server';
/**
 * @fileOverview Öğrenci deneme sınavı sonuçlarını analiz eden bir AI akışı.
 *
 * - analyzeStudentReport - Öğrenci verilerini analiz eden fonksiyon.
 * - AnalyzeStudentReportInput - analyzeStudentReport fonksiyonu için giriş tipi.
 * - AnalyzeStudentReportOutput - analyzeStudentReport fonksiyonu için dönüş tipi.
 */

import { ai } from '@/ai/genkit';
import { StudentExamResult } from '@/types';
import { z } from 'genkit';

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
    turkce_d: z.number(), turkce_y: z.number(), turkce_net: z.number(),
    tarih_d: z.number(), tarih_y: z.number(), tarih_net: z.number(),
    din_d: z.number(), din_y: z.number(), din_net: z.number(),
    ing_d: z.number(), ing_y: z.number(), ing_net: z.number(),
    mat_d: z.number(), mat_y: z.number(), mat_net: z.number(),
    fen_d: z.number(), fen_y: z.number(), fen_net: z.number(),
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
  strengths: z.array(z.string()).describe('Öğrencinin güçlü olduğu yönleri ve dersleri listeleyen maddeler.'),
  areasForImprovement: z.array(z.string()).describe('Öğrencinin gelişmesi gereken alanları ve dersleri listeleyen maddeler.'),
  roadmap: z.array(z.object({
    title: z.string().describe('Yol haritası adımının başlığı.'),
    description: z.string().describe('Yol haritası adımının detaylı açıklaması.'),
  })).describe('Öğrencinin başarısını artırmak için atılması gereken adımları içeren yol haritası.'),
  recommendations: z.array(z.object({
    title: z.string().describe('Öneri başlığı.'),
    description: z.string().describe('Önerinin detaylı açıklaması.'),
  })).describe('Öğrencinin genel başarısını ve motivasyonunu artırmak için ek öneriler.'),
});
export type AnalyzeStudentReportOutput = z.infer<
  typeof AnalyzeStudentReportOutputSchema
>;

export async function analyzeStudentReport(
  input: AnalyzeStudentReportInput
): Promise<AnalyzeStudentReportOutput> {
  // Veriyi prompt için daha okunabilir bir formata dönüştür
  const formattedResults = input.examResults.map(r => 
    `Deneme: ${r.exam_name}, Puan: ${r.toplam_puan.toFixed(2)}, Net: ${r.toplam_net.toFixed(2)} (Türkçe: ${r.turkce_net.toFixed(2)}, Mat: ${r.mat_net.toFixed(2)}, Fen: ${r.fen_net.toFixed(2)}, Tarih: ${r.tarih_net.toFixed(2)}, Din: ${r.din_net.toFixed(2)}, İng: ${r.ing_net.toFixed(2)})`
  ).join('\n');

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
  prompt: `Sen LGS konusunda uzman bir eğitim danışmanısın. Sana verilen öğrenci bilgilerini ve deneme sınavı sonuçlarını analiz ederek öğrencinin genel durumu hakkında detaylı bir rapor hazırla.

Rapor aşağıdaki gibi yapılandırılmalıdır:
1.  **summary:** Öğrencinin genel akademik performansını, denemeler arasındaki değişimini ve genel potansiyelini özetleyen bir giriş paragrafı yaz. Sana verilen metin formatındaki sonuçları yorumlayarak başla.
2.  **strengths:** Öğrencinin istikrarlı bir şekilde başarılı olduğu dersleri ve konuları vurgulayan 2-3 maddelik bir liste oluştur.
3.  **areasForImprovement:** Öğrencinin zorlandığı, netlerinin düşük veya değişken olduğu dersleri tespit eden 2-3 maddelik bir liste oluştur. Özellikle LGS'de katsayısı yüksek olan derslerdeki (Matematik, Fen, Türkçe) duruma dikkat çek.
4.  **roadmap:** Öğrencinin performansını artırmak için 5-6 adımlık somut ve uygulanabilir bir yol haritası oluştur. Her adımın bir 'title' (başlık) ve 'description' (açıklama) alanı olmalıdır. Başlıklar kısa ve eyleme yönelik olmalı (örn: "Detaylı Konu ve Kazanım Analizi"). Açıklamalar ise bu adımı detaylandırmalıdır.
5.  **recommendations:** Öğrencinin genel gelişimi için 4-5 maddelik ek öneriler sun. Her önerinin bir 'title' (başlık) ve 'description' (açıklama) alanı olmalıdır (örn: "Ders ve Konu Bazlı Veri Toplama", "Hedef Belirleme Çalıştayı").

Tüm metinleri profesyonel, yapıcı ve motive edici bir dille yaz.

Öğrenci Bilgileri:
- Ad: {{{studentName}}}
- Sınıf: {{{className}}}
- Analiz Edilen Deneme: {{{examName}}}

Analiz Edilecek Deneme Sonuçları Özeti:
{{{examResultsAsText}}}

Lütfen sadece 'summary', 'strengths', 'areasForImprovement', 'roadmap' ve 'recommendations' alanlarını doldurarak bir JSON çıktısı üret.`,
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
