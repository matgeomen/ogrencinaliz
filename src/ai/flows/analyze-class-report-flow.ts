'use server';
/**
 * @fileOverview Sınıf deneme sınavı sonuçlarını analiz eden bir AI akışı.
 *
 * - analyzeClassReport - Sınıf verilerini analiz eden fonksiyon.
 * - AnalyzeClassReportInput - analyzeClassReport fonksiyonu için giriş tipi.
 * - AnalyzeClassReportOutput - analyzeClassReport fonksiyonu için dönüş tipi.
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


const AnalyzeClassReportInputSchema = z.object({
  className: z.string().describe('Analiz edilen sınıfın adı.'),
  examName: z.string().describe("Analiz edilen deneme sınavı (veya 'Tüm Denemeler')."),
  examResults: z.array(StudentExamResultSchema).describe("Sınıftaki öğrencilerin ilgili deneme sınavı sonuçları."),
});
export type AnalyzeClassReportInput = z.infer<typeof AnalyzeClassReportInputSchema>;

const AnalyzeClassReportOutputSchema = z.object({
  summary: z.string().describe('Sınıfın genel performansını, ortalamalarını ve potansiyelini özetleyen bir giriş paragrafı.'),
  strengths: z.array(z.string()).describe('Sınıfın genel olarak güçlü olduğu yönleri ve dersleri listeleyen maddeler.'),
  areasForImprovement: z.array(z.string()).describe('Sınıfın genel olarak gelişmesi gereken alanları ve dersleri listeleyen maddeler.'),
  roadmap: z.array(z.object({
    title: z.string().describe('Yol haritası adımının başlığı.'),
    description: z.string().describe('Yol haritası adımının detaylı açıklaması.'),
  })).describe('Sınıfın başarısını artırmak için atılması gereken adımları içeren yol haritası.'),
  recommendations: z.array(z.object({
    title: z.string().describe('Öneri başlığı.'),
    description: z.string().describe('Önerinin detaylı açıklaması.'),
  })).describe('Sınıfın genel başarısını ve motivasyonunu artırmak için ek öneriler.'),
});
export type AnalyzeClassReportOutput = z.infer<
  typeof AnalyzeClassReportOutputSchema
>;

export async function analyzeClassReport(
  input: AnalyzeClassReportInput
): Promise<AnalyzeClassReportOutput> {
  const studentCount = new Set(input.examResults.map(r => r.student_no)).size;
  
  // Eğer 'Tüm Denemeler' seçildiyse, her öğrencinin ortalamasını al
  let analyzedResults = input.examResults;
  if (input.examName === 'Tüm Denemeler') {
      const studentAverages: { [key: number]: StudentExamResult } = {};
      const studentCounts: { [key: number]: number } = {};

      input.examResults.forEach(r => {
          if (!studentAverages[r.student_no]) {
              studentAverages[r.student_no] = { ...r, exam_name: 'Ortalama', toplam_dogru: 0, toplam_yanlis: 0, toplam_net: 0, toplam_puan: 0, turkce_d: 0, turkce_y: 0, turkce_net: 0, tarih_d: 0, tarih_y: 0, tarih_net: 0, din_d: 0, din_y: 0, din_net: 0, ing_d: 0, ing_y: 0, ing_net: 0, mat_d: 0, mat_y: 0, mat_net: 0, fen_d: 0, fen_y: 0, fen_net: 0 };
              studentCounts[r.student_no] = 0;
          }
          studentAverages[r.student_no].toplam_net += r.toplam_net;
          studentAverages[r.student_no].toplam_puan += r.toplam_puan;
          studentCounts[r.student_no]++;
      });

      Object.keys(studentAverages).forEach(student_no_str => {
          const student_no = Number(student_no_str);
          const count = studentCounts[student_no];
          studentAverages[student_no].toplam_net /= count;
          studentAverages[student_no].toplam_puan /= count;
      });
      analyzedResults = Object.values(studentAverages);
  }

  const totalNet = analyzedResults.reduce((sum, r) => sum + r.toplam_net, 0);
  const totalScore = analyzedResults.reduce((sum, r) => sum + r.toplam_puan, 0);
  const entryCount = analyzedResults.length;
  const avgNet = entryCount > 0 ? (totalNet / entryCount) : 0;
  const avgScore = entryCount > 0 ? (totalScore / entryCount) : 0;

  const summaryText = `Sınıfta ${studentCount} öğrenci bulunmaktadır. Analiz edilen "${input.examName}" kapsamındaki verilere göre sınıfın genel net ortalaması ${avgNet.toFixed(2)}, puan ortalaması ise ${avgScore.toFixed(2)}'dir.`;

  return analyzeClassReportFlow({
    className: input.className,
    examName: input.examName,
    classSummary: summaryText,
  });
}

const PromptInputSchema = z.object({
    className: z.string(),
    examName: z.string(),
    classSummary: z.string(),
});

const prompt = ai.definePrompt({
  name: 'analyzeClassReportPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: AnalyzeClassReportOutputSchema},
  prompt: `Sen LGS konusunda uzman bir eğitim danışmanısın. Sana verilen sınıf bilgilerini ve deneme sınavı sonuçları özetini analiz ederek sınıfın genel durumu hakkında detaylı bir rapor hazırla.

Rapor aşağıdaki gibi yapılandırılmalıdır:
1.  **summary:** Sınıfın genel akademik performansını, deneme ortalamalarını ve genel potansiyelini değerlendiren bir paragraf yaz.
2.  **strengths:** Sınıfın bir bütün olarak başarılı olduğu, ortalamalarının yüksek olduğu dersleri veya konuları vurgulayan 2-3 maddelik bir liste oluştur.
3.  **areasForImprovement:** Sınıfın genel olarak zorlandığı, net ortalamalarının düşük olduğu dersleri veya konuları tespit eden 2-3 maddelik bir liste oluştur. Özellikle LGS'de katsayısı yüksek olan derslerdeki (Matematik, Fen, Türkçe) genel duruma dikkat çek.
4.  **roadmap:** Sınıfın kolektif performansını artırmak için 5-6 adımlık somut ve uygulanabilir bir yol haritası oluştur. Her adımın bir 'title' (başlık) ve 'description' (açıklama) alanı olmalıdır. Başlıklar kısa ve eyleme yönelik olmalı (örn: "Detaylı Konu ve Kazanım Analizi"). Açıklamalar ise bu adımı detaylandırmalıdır.
5.  **recommendations:** Sınıfın genel gelişimi için 4-5 maddelik ek öneriler sun. Her önerinin bir 'title' (başlık) ve 'description' (açıklama) alanı olmalıdır (örn: "Ders ve Konu Bazlı Veri Toplama", "Hedef Belirleme Çalıştayı").

Tüm metinleri profesyonel, yapıcı ve yol gösterici bir dille yaz. Analizini, sınıfın kolektif başarısını artırmaya yönelik içgörüler sunacak şekilde odakla.

Sınıf Bilgileri:
- Sınıf Adı: {{{className}}}
- Analiz Edilen Deneme: {{{examName}}}

Sınıf Özeti:
{{{classSummary}}}

Lütfen sadece 'summary', 'strengths', 'areasForImprovement', 'roadmap' ve 'recommendations' alanlarını doldurarak bir JSON çıktısı üret.`,
});

const analyzeClassReportFlow = ai.defineFlow(
  {
    name: 'analyzeClassReportFlow',
    inputSchema: PromptInputSchema,
    outputSchema: AnalyzeClassReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
