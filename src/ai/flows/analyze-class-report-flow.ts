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
  examName: z.string().describe("Analiz edilen deneme sınavları."),
  examResults: z.array(StudentExamResultSchema).describe("Sınıftaki öğrencilerin ilgili deneme sınavı sonuçları."),
});
export type AnalyzeClassReportInput = z.infer<typeof AnalyzeClassReportInputSchema>;

const AnalyzeClassReportOutputSchema = z.object({
  analysis: z.string().describe("Sınıfın genel performansını, güçlü ve zayıf yönlerini, potansiyelini ve gelişim için önerileri içeren bütüncül bir analiz metni. Metin, paragraflar halinde yapılandırılmalıdır."),
});
export type AnalyzeClassReportOutput = z.infer<
  typeof AnalyzeClassReportOutputSchema
>;

export async function analyzeClassReport(
  input: AnalyzeClassReportInput
): Promise<AnalyzeClassReportOutput> {
  const studentCount = new Set(input.examResults.map(r => r.student_no)).size;
  
  let analyzedResults = input.examResults;
  const uniqueExamNames = new Set(input.examResults.map(r => r.exam_name));

  if (uniqueExamNames.size > 1) {
      const studentAverages: { [key: number]: StudentExamResult } = {};
      const studentCounts: { [key: number]: number } = {};

      input.examResults.forEach(r => {
          if (!studentAverages[r.student_no]) {
              studentAverages[r.student_no] = { ...r, exam_name: 'Ortalama', toplam_dogru: 0, toplam_yanlis: 0, toplam_net: 0, toplam_puan: 0, turkce_d: 0, turkce_y: 0, turkce_net: 0, tarih_d: 0, tarih_y: 0, tarih_net: 0, din_d: 0, din_y: 0, din_net: 0, ing_d: 0, ing_y: 0, ing_net: 0, mat_d: 0, mat_y: 0, mat_net: 0, fen_d: 0, fen_y: 0, fen_net: 0 };
              studentCounts[r.student_no] = 0;
          }
          studentAverages[r.student_no].toplam_net += r.toplam_net;
          studentAverages[r.student_no].toplam_puan += r.toplam_puan;
          studentAverages[r.student_no].turkce_net += r.turkce_net;
          studentAverages[r.student_no].mat_net += r.mat_net;
          studentAverages[r.student_no].fen_net += r.fen_net;
          studentAverages[r.student_no].tarih_net += r.tarih_net;
          studentAverages[r.student_no].din_net += r.din_net;
          studentAverages[r.student_no].ing_net += r.ing_net;
          studentCounts[r.student_no]++;
      });

      Object.keys(studentAverages).forEach(student_no_str => {
          const student_no = Number(student_no_str);
          const count = studentCounts[student_no];
          if (count > 0) {
            studentAverages[student_no].toplam_net /= count;
            studentAverages[student_no].toplam_puan /= count;
            studentAverages[student_no].turkce_net /= count;
            studentAverages[student_no].mat_net /= count;
            studentAverages[student_no].fen_net /= count;
            studentAverages[student_no].tarih_net /= count;
            studentAverages[student_no].din_net /= count;
            studentAverages[r.student_no].ing_net /= count;
          }
      });
      analyzedResults = Object.values(studentAverages);
  }

  const entryCount = analyzedResults.length;
  if (entryCount === 0) {
    throw new Error("No data available for analysis.");
  }
  
  const totalNet = analyzedResults.reduce((sum, r) => sum + r.toplam_net, 0);
  const totalScore = analyzedResults.reduce((sum, r) => sum + r.toplam_puan, 0);
  const avgNet = totalNet / entryCount;
  const avgScore = totalScore / entryCount;
  
  const avgTurkceNet = analyzedResults.reduce((sum, r) => sum + r.turkce_net, 0) / entryCount;
  const avgMatNet = analyzedResults.reduce((sum, r) => sum + r.mat_net, 0) / entryCount;
  const avgFenNet = analyzedResults.reduce((sum, r) => sum + r.fen_net, 0) / entryCount;
  const avgTarihNet = analyzedResults.reduce((sum, r) => sum + r.tarih_net, 0) / entryCount;
  const avgDinNet = analyzedResults.reduce((sum, r) => sum + r.din_net, 0) / entryCount;
  const avgIngNet = analyzedResults.reduce((sum, r) => sum + r.ing_net, 0) / entryCount;

  const summaryText = `Sınıfta ${studentCount} öğrenci bulunmaktadır. Analiz edilen "${input.examName}" kapsamındaki verilere göre sınıfın genel net ortalaması ${avgNet.toFixed(2)}, puan ortalaması ise ${avgScore.toFixed(2)}'dir. Ders bazlı ortalama netler: Türkçe ${avgTurkceNet.toFixed(2)}, Matematik ${avgMatNet.toFixed(2)}, Fen Bilimleri ${avgFenNet.toFixed(2)}, T.C. İnkılap Tarihi ${avgTarihNet.toFixed(2)}, Din Kültürü ${avgDinNet.toFixed(2)}, İngilizce ${avgIngNet.toFixed(2)}.`;

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
  prompt: `Sen LGS konusunda uzman bir eğitim danışmanısın. Sana verilen sınıf bilgilerini ve deneme sınavı sonuçları özetini analiz ederek sınıfın genel durumu hakkında detaylı ve bütüncül bir rapor hazırla.

Raporu, birkaç paragraflık akıcı bir metin olarak yaz. Analizinde şu noktalara değin:
1.  **Giriş ve Genel Değerlendirme:** Sana verdiğim özet metnini yorumlayarak başla. Sınıfın genel akademik performansını, deneme ortalamalarını ve genel potansiyelini değerlendir.
2.  **Güçlü Yönler ve Başarılar:** Sınıfın bir bütün olarak başarılı olduğu, ortalamalarının yüksek olduğu dersleri veya konuları vurgula.
3.  **Geliştirilmesi Gereken Alanlar:** Sınıfın genel olarak zorlandığı, net ortalamalarının düşük olduğu dersleri veya konuları tespit et. Özellikle LGS'de katsayısı yüksek olan derslerdeki (Matematik, Fen, Türkçe) genel duruma dikkat çek.
4.  **Sonuç ve Öneriler:** Sınıfın kolektif performansını artırmak için somut ve uygulanabilir önerilerde bulun. Bu, genel bir strateji veya birkaç önemli tavsiye olabilir.

Tüm metni profesyonel, yapıcı ve yol gösterici bir dille yaz. Analizini, sınıfın kolektif başarısını artırmaya yönelik içgörüler sunacak şekilde odakla. Raporun okunması kolay ve anlaşılır olmalı.

Sınıf Bilgileri:
- Sınıf Adı: {{{className}}}
- Analiz Edilen Deneme: {{{examName}}}

Sınıf Özeti ve Ortalama Netler:
{{{classSummary}}}

Lütfen sadece 'analysis' alanını doldurarak bir JSON çıktısı üret.`,
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
