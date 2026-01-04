
'use server';
/**
 * @fileOverview Veli için öğrenci deneme sınavı sonuçlarını analiz eden bir AI akışı.
 *
 * - analyzeParentReport - Veli için öğrenci verilerini analiz eden fonksiyon.
 * - AnalyzeParentReportInput - analyzeParentReport fonksiyonu için giriş tipi.
 * - AnalyzeParentReportOutput - analyzeParentReport fonksiyonu için dönüş tipi.
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


const AnalyzeParentReportInputSchema = z.object({
  studentName: z.string().describe('Öğrencinin adı.'),
  examName: z.string().describe("Analiz edilen deneme sınavları (veya 'Tüm Denemeler')."),
  examResults: z.array(StudentExamResultSchema).describe("Öğrencinin ilgili deneme sınavı sonuçları."),
});
export type AnalyzeParentReportInput = z.infer<typeof AnalyzeParentReportInputSchema>;

const AnalyzeParentReportOutputSchema = z.object({
  summary: z.string().describe('Öğrencinin genel durumunu, velinin anlayacağı dilde, basit ve teşvik edici bir şekilde özetleyen bir paragraf.'),
  strengths: z.array(z.string()).describe('Öğrencinin başarılı olduğu dersleri ve özellikle iyi yaptığı konuları öven ve takdir eden 2-3 madde.'),
  areasForImprovement: z.array(z.string()).describe('Öğrencinin desteklenmesi gereken dersleri veya özellikle zorlandığı konuları, suçlayıcı olmadan, yapıcı bir dille belirten 2-3 madde.'),
  homeSupportSuggestions: z.array(z.object({
    title: z.string().describe('Evde destek önerisinin başlığı.'),
    description: z.string().describe('Velinin evde öğrenciye nasıl destek olabileceğini açıklayan basit ve uygulanabilir öneri.'),
  })).describe('Velinin öğrencinin başarısını artırmak için evde yapabileceği somut eylemleri içeren öneriler.'),
});
export type AnalyzeParentReportOutput = z.infer<
  typeof AnalyzeParentReportOutputSchema
>;

export async function analyzeParentReport(
  input: AnalyzeParentReportInput
): Promise<AnalyzeParentReportOutput> {
  const formattedResults = input.examResults.map(r => {
    const dersler = [
      `Türkçe Net: ${r.turkce.net.toFixed(2)}`,
      `Matematik Net: ${r.mat.net.toFixed(2)}`,
      `Fen Net: ${r.fen.net.toFixed(2)}`
    ].join(', ');

    const zorlanilanKonular = [
      ...r.turkce.kazanimlar, ...r.mat.kazanimlar, ...r.fen.kazanimlar, 
      ...r.tarih.kazanimlar, ...r.din.kazanimlar, ...r.ing.kazanimlar
    ]
    .filter(k => k.sonuc === 'Y')
    .map(k => k.konu)
    .join(', ') || "Belirgin bir konu yok";

    return `Deneme: ${r.exam_name}, Puan: ${r.toplam_puan.toFixed(2)}, Net: ${r.toplam_net.toFixed(2)}. ${dersler}. Zorlanılan konular: ${zorlanilanKonular}.`;
  }).join('\n');

  return analyzeParentReportFlow({
    studentName: input.studentName,
    examName: input.examName,
    examResultsAsText: formattedResults,
  });
}

const PromptInputSchema = z.object({
    studentName: z.string(),
    examName: z.string(),
    examResultsAsText: z.string(),
});

const prompt = ai.definePrompt({
  name: 'analyzeParentReportPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: AnalyzeParentReportOutputSchema},
  prompt: `Sen LGS konusunda uzman bir eğitim danışmanısın ve bu raporu doğrudan öğrenci velisine yazıyorsun. Dilin son derece basit, anlaşılır, teşvik edici ve kesinlikle yargılayıcı olmamalı. Teknik terimlerden ve karmaşık sayılardan kaçın. Amacın veliyi bilgilendirmek ve öğrenciye nasıl destek olabileceği konusunda yol göstermek.

Rapor aşağıdaki gibi yapılandırılmalıdır:
1.  **summary:** Öğrencinin genel akademik durumunu özetle. Başarılarını ve çabasını takdir et. Gelişim alanlarına nazikçe değin. Örneğin: "{{{studentName}}}, girdiği denemelerde genel olarak iyi bir performans sergiliyor ve çabası takdire şayan. Özellikle bazı derslerdeki başarısı göz doldururken, bazı konularda ise ona destek olarak daha da başarılı olmasını sağlayabiliriz."
2.  **strengths:** Öğrencinin başarılı olduğu dersleri veya ÖZELLİKLE İYİ YAPTIĞI KONULARI belirt. "Türkçe dersinde 'Cümlenin Öğeleri' gibi konularda ne kadar dikkatli olduğunu görüyoruz, harika!" gibi basit ve övücü ifadeler kullan.
3.  **areasForImprovement:** Desteğe ihtiyaç duyduğu alanları ve ÖZELLİKLE ZORLANDIĞI KONULARI belirt. "Matematik dersinde 'Üslü Sayılar' konusunda biraz zorlanıyor gibi görünüyor. Bu konuda ona yardımcı olabiliriz." gibi ifadeler kullan. Asla "başarısız", "kötü" gibi kelimeler kullanma. "Bu alanda potansiyelini tam olarak göstermesi için desteğimize ihtiyacı var" gibi yapıcı bir dil kullan.
4.  **homeSupportSuggestions:** Velinin evde yapabileceği, somut ve basit 3-4 öneri sun. Önerileri, çocuğun zorlandığı konulara göre kişiselleştir. Her önerinin bir 'title' (başlık) ve 'description' (açıklama) alanı olmalıdır. Örneğin, başlık "Soru Çözümünü Konuşmak" ve açıklama "'Üslü Sayılar' konusunda çözemediği bir soruyu size anlatmasını istemek, konuyu daha iyi anlamasına yardımcı olabilir. Cevabı bilmeseniz bile, sadece dinlemek bile çok faydalıdır."

Öğrenci Bilgileri:
- Ad: {{{studentName}}}
- Analiz Edilen Deneme: {{{examName}}}

Analiz Edilecek Deneme Sonuçları Özeti (Konu Detayları Dahil):
{{{examResultsAsText}}}

Lütfen sadece 'summary', 'strengths', 'areasForImprovement' ve 'homeSupportSuggestions' alanlarını doldurarak bir JSON çıktısı üret.`,
});

const analyzeParentReportFlow = ai.defineFlow(
  {
    name: 'analyzeParentReportFlow',
    inputSchema: PromptInputSchema,
    outputSchema: AnalyzeParentReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
