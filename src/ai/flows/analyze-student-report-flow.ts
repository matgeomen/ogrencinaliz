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
    tarih_d: z.number(), tarih_y: znumber(), tarih_net: z.number(),
    din_d: z.number(), din_y: z.number(), din_net: z.number(),
    ing_d: z.number(), ing_y: z.number(), ing_net: z.number(),
    mat_d: z.number(), mat_y: z.number(), mat_net: z.number(),
    fen_d: z.number(), fen_y: z.number(), fen_net: z.number(),
});


const AnalyzeStudentReportInputSchema = z.object({
  studentName: z.string().describe('Öğrencinin adı.'),
  className: z.string().describe('Öğrencinin sınıfı.'),
  examResults: z.array(StudentExamResultSchema).describe("Öğrencinin tüm deneme sınavı sonuçları."),
});
export type AnalyzeStudentReportInput = z.infer<typeof AnalyzeStudentReportInputSchema>;

const AnalyzeStudentReportOutputSchema = z.object({
  analysis: z
    .string()
    .describe('Öğrencinin deneme sınavı verilerinin analizini içeren detaylı rapor.'),
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
    examResultsAsText: formattedResults,
  });
}

const PromptInputSchema = z.object({
    studentName: z.string(),
    className: z.string(),
    examResultsAsText: z.string(),
});

const prompt = ai.definePrompt({
  name: 'analyzeStudentReportPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: AnalyzeStudentReportOutputSchema},
  prompt: `Sen LGS konusunda uzman bir eğitim danışmanısın. Sana verilen öğrenci bilgilerini ve deneme sınavı sonuçlarını analiz ederek öğrencinin genel durumu hakkında detaylı bir "Genel Değerlendirme" raporu hazırla.

Analizinde aşağıdaki noktalara odaklan:
1.  **Genel Akademik Performans:** Öğrencinin genel performansını, denemeler arasındaki puan ve net değişimlerini özetle. Yükselişte mi, düşüşte mi yoksa istikrarlı mı olduğunu belirt.
2.  **Güçlü Yönler:** Öğrencinin istikrarlı bir şekilde başarılı olduğu dersleri ve konuları vurgula. Hangi derslerin netlerinin ortalamanın üzerinde olduğunu belirt.
3.  **Geliştirilmesi Gereken Alanlar:** Öğrencinin zorlandığı, netlerinin düşük veya değişken olduğu dersleri tespit et. Özellikle LGS'de katsayısı yüksek olan derslerdeki (Matematik, Fen, Türkçe) duruma dikkat çek.
4.  **Somut Öneriler:** Performansını artırmak için öğrenciye ve velisine yönelik somut, uygulanabilir önerilerde bulun. Örneğin: "Matematik dersinde netleri düşük olduğundan, özellikle 'Cebirsel İfadeler' ve 'Veri Analizi' konularına öncelik vererek ek soru çözümü yapması faydalı olacaktır." veya "Türkçe dersindeki başarısını sürdürmesi için paragraf sorularına yönelik hız kazanma çalışmaları yapabilir."
5.  **Motivasyon:** Raporu yapıcı, motive edici ve yol gösterici bir dille yaz. Öğrencinin potansiyeline vurgu yap.

Rapor sadece "Genel Değerlendirme" başlığı altında tek bir metin paragrafı olarak sunulmalıdır. Maddeleme veya alt başlıklar kullanma.

Öğrenci Bilgileri:
- Ad: {{{studentName}}}
- Sınıf: {{{className}}}

Analiz Edilecek Deneme Sonuçları Özeti:
{{{examResultsAsText}}}

Lütfen sadece 'analysis' alanını doldurarak bir JSON çıktısı üret. Çıktı, uzun ve detaylı tek bir paragraf olmalıdır.`,
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

    