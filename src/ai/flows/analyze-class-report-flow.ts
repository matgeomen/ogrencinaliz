
'use server';
/**
 * @fileOverview Sınıf deneme sınavı sonuçlarını analiz ederek genel öneriler sunan bir AI akışı.
 *
 * - analyzeClassReport - Sınıf verilerini analiz edip öneriler üreten fonksiyon.
 * - AnalyzeClassReportInput - analyzeClassReport fonksiyonu için giriş tipi.
 * - AnalyzeClassReportOutput - analyzeClassReport fonksiyonu için dönüş tipi.
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


const AnalyzeClassReportInputSchema = z.object({
  className: z.string().describe('Analiz edilen sınıfın adı.'),
  examName: z.string().describe("Analiz edilen deneme sınavları."),
  examResults: z.array(StudentExamResultSchema).describe("Sınıftaki öğrencilerin ilgili deneme sınavı sonuçları."),
});
export type AnalyzeClassReportInput = z.infer<typeof AnalyzeClassReportInputSchema>;

const AnalyzeClassReportOutputSchema = z.object({
  summary: z.string().describe('Sınıfın genel durumunu, ortalamalarını ve potansiyelini özetleyen bir giriş paragrafı.'),
  strengths: z.array(z.string()).describe('Sınıfın kolektif olarak güçlü olduğu dersleri ve konuları belirten 2-3 madde.'),
  areasForImprovement: z.array(z.string()).describe('Sınıfın kolektif olarak desteklenmesi gereken dersleri veya en çok yanlış yapılan konuları belirten 2-3 madde.'),
  roadmap: z.array(z.object({
    title: z.string().describe('Yol haritası adımının başlığı.'),
    description: z.string().describe('Adımın detaylı açıklaması.'),
  })).describe("Sınıfın genel başarısını artırmak için atılması gereken adımları içeren 3-4 adımlık bir yol haritası.")
});
export type AnalyzeClassReportOutput = z.infer<
  typeof AnalyzeClassReportOutputSchema
>;

export async function analyzeClassReport(
  input: AnalyzeClassReportInput
): Promise<AnalyzeClassReportOutput> {
  
  const studentCount = new Set(input.examResults.map(r => r.student_no)).size;
  const entryCount = input.examResults.length;
  
  if (entryCount === 0) {
    throw new Error("Analiz için veri bulunamadı.");
  }
  
  const avgNet = input.examResults.reduce((sum, r) => sum + r.toplam_net, 0) / entryCount;
  const avgScore = input.examResults.reduce((sum, r) => sum + r.toplam_puan, 0) / entryCount;
  
  const avgTurkceNet = input.examResults.reduce((sum, r) => sum + r.turkce.net, 0) / entryCount;
  const avgMatNet = input.examResults.reduce((sum, r) => sum + r.mat.net, 0) / entryCount;
  const avgFenNet = input.examResults.reduce((sum, r) => sum + r.fen.net, 0) / entryCount;
  const avgTarihNet = input.examResults.reduce((sum, r) => sum + r.tarih.net, 0) / entryCount;
  const avgDinNet = input.examResults.reduce((sum, r) => sum + r.din.net, 0) / entryCount;
  const avgIngNet = input.examResults.reduce((sum, r) => sum + r.ing.net, 0) / entryCount;

  // Sınıf genelinde en çok yanlış yapılan konuları bul
  const konuYanlislari: { [key: string]: number } = {};
  input.examResults.forEach(result => {
    Object.values(result).forEach(ders => {
      if (ders && Array.isArray(ders.kazanimlar)) {
        ders.kazanimlar.forEach((kazanim: any) => {
          if (kazanim.sonuc === 'Y') {
            konuYanlislari[kazanim.konu] = (konuYanlislari[kazanim.konu] || 0) + 1;
          }
        });
      }
    });
  });

  const enCokYanlisYapilanKonular = Object.entries(konuYanlislari)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([konu, sayi]) => `${konu} (${sayi} yanlış)`)
    .join(', ');

  const summaryText = `Analiz edilen "${input.examName}" kapsamındaki ${entryCount} sınav sonucuna göre, sınıfta ${studentCount} öğrenci bulunmaktadır. Sınıfın genel net ortalaması ${avgNet.toFixed(2)}, puan ortalaması ise ${avgScore.toFixed(2)}'dir. Ders bazlı ortalama netler şöyledir: Türkçe ${avgTurkceNet.toFixed(2)}, Matematik ${avgMatNet.toFixed(2)}, Fen Bilimleri ${avgFenNet.toFixed(2)}, T.C. İnkılap Tarihi ${avgTarihNet.toFixed(2)}, Din Kültürü ${avgDinNet.toFixed(2)}, İngilizce ${avgIngNet.toFixed(2)}. Sınıf genelinde en çok zorlanılan konular: ${enCokYanlisYapilanKonular || 'Belirlenmedi'}.`;

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
  prompt: `Sen LGS konusunda uzman bir eğitim danışmanısın. Sana verilen sınıf bilgilerini ve deneme sınavı sonuçları özetini (en çok yanlış yapılan konular dahil) analiz ederek, o sınıfın kolektif başarısı hakkında bir rapor hazırla.

Rapor aşağıdaki gibi yapılandırılmalıdır:
1.  **summary:** Sınıfın genel akademik durumunu, ortalamalarını ve potansiyelini özetleyen bir giriş paragrafı yaz.
2.  **strengths:** Sınıfın bir bütün olarak en başarılı olduğu dersleri veya konuları vurgulayan 2-3 maddelik bir liste oluştur.
3.  **areasForImprovement:** Sınıfın genel olarak zorlandığı, ortalamanın düşük olduğu dersleri ve ÖZELLİKLE en çok yanlış yapılan spesifik konu başlıklarını tespit eden 2-3 maddelik bir liste oluştur. Bu, raporun en önemli kısmıdır.
4.  **roadmap:** Sınıfın kolektif başarısını artırmak için öğretmenlerin ve yönetimin atabileceği 3-4 adımlık somut ve uygulanabilir bir yol haritası oluştur. Önerilerini, sınıfın zorlandığı konulara odakla (örn: "Topluca 'Kareköklü Sayılar' konusu tekrarı yapılabilir."). Her adım için bir 'title' ve 'description' alanı olmalıdır.

Tüm metni profesyonel, yapıcı ve yol gösterici bir dille yaz.

Sınıf Bilgileri:
- Sınıf Adı: {{{className}}}
- Analiz Edilen Deneme: {{{examName}}}

Sınıf Özeti ve Ortalama Netler (En Çok Yanlış Yapılan Konular Dahil):
{{{classSummary}}}

Lütfen sadece 'summary', 'strengths', 'areasForImprovement' ve 'roadmap' alanlarını doldurarak bir JSON çıktısı üret.`,
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
