'use server';
/**
 * @fileOverview Veli için öğrenci deneme sınavı sonuçlarını analiz eden bir AI akışı.
 *
 * - analyzeParentReport - Veli için öğrenci verilerini analiz eden fonksiyon.
 * - AnalyzeParentReportInput - analyzeParentReport fonksiyonu için giriş tipi.
 * - AnalyzeParentReportOutput - analyzeParentReport fonksiyonu için dönüş tipi.
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


const AnalyzeParentReportInputSchema = z.object({
  studentName: z.string().describe('Öğrencinin adı.'),
  examName: z.string().describe("Analiz edilen deneme sınavı (veya 'Tüm Denemeler')."),
  examResults: z.array(StudentExamResultSchema).describe("Öğrencinin ilgili deneme sınavı sonuçları."),
});
export type AnalyzeParentReportInput = z.infer<typeof AnalyzeParentReportInputSchema>;

const AnalyzeParentReportOutputSchema = z.object({
  summary: z.string().describe('Öğrencinin genel durumunu, velinin anlayacağı dilde, basit ve teşvik edici bir şekilde özetleyen bir paragraf.'),
  strengths: z.array(z.string()).describe('Öğrencinin başarılı olduğu dersleri ve alanları öven ve takdir eden 2-3 madde.'),
  areasForImprovement: z.array(z.string()).describe('Öğrencinin desteklenmesi gereken dersleri veya konuları, suçlayıcı olmadan, yapıcı bir dille belirten 2-3 madde.'),
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
  const formattedResults = input.examResults.map(r => 
    `Deneme: ${r.exam_name}, Puan: ${r.toplam_puan.toFixed(2)}, Net: ${r.toplam_net.toFixed(2)}`
  ).join('\n');

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
  prompt: `Sen LGS konusunda uzman bir eğitim danışmanısın ve bu raporu doğrudan öğrenci velisine yazıyorsun. Dilin son derece basit, anlaşılır, teşvik edici ve kesinlikle yargılayıcı olmamalı. Teknik terimlerden kaçın. Amacın veliyi bilgilendirmek ve öğrenciye nasıl destek olabileceği konusunda yol göstermek.

Rapor aşağıdaki gibi yapılandırılmalıdır:
1.  **summary:** Öğrencinin genel akademik durumunu özetle. Başarılarını ve çabasını takdir et. Gelişim alanlarına nazikçe değin. Örneğin: "{{{studentName}}}, girdiği denemelerde genel olarak iyi bir performans sergiliyor ve çabası takdire şayan. Özellikle bazı derslerdeki başarısı göz doldururken, bazı konularda ise ona destek olarak daha da başarılı olmasını sağlayabiliriz."
2.  **strengths:** Öğrencinin başarılı olduğu dersleri veya alanları belirt. "Şu derste çok başarılı" gibi basit ve övücü ifadeler kullan.
3.  **areasForImprovement:** Desteğe ihtiyaç duyduğu alanları belirt. "Matematik dersinde biraz zorlanıyor" gibi ifadeler kullan. Asla "başarısız", "kötü" gibi kelimeler kullanma. "Bu alanda potansiyelini tam olarak göstermesi için desteğimize ihtiyacı var" gibi yapıcı bir dil kullan.
4.  **homeSupportSuggestions:** Velinin evde yapabileceği, somut ve basit 3-4 öneri sun. Her önerinin bir 'title' (başlık) ve 'description' (açıklama) alanı olmalıdır. Örneğin, başlık "Çalışma Ortamını Gözden Geçirme" ve açıklama "Ders çalışırken dikkatini dağıtacak unsurların (telefon, televizyon vb.) daha az olduğu sessiz bir ortam oluşturmak, odaklanmasına yardımcı olabilir." veya başlık "Birlikte Kitap Okuma Saati" ve açıklama "Her gün 15-20 dakika bile olsa birlikte kitap okumak, okuduğunu anlama becerisini tüm dersler için geliştirecektir."

Öğrenci Bilgileri:
- Ad: {{{studentName}}}
- Analiz Edilen Deneme: {{{examName}}}

Analiz Edilecek Deneme Sonuçları Özeti:
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
