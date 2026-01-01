'use server';
/**
 * @fileOverview E-Okul verilerini analiz eden bir AI akışı.
 *
 * - analyzeEokulData - E-Okul verilerini analiz eden fonksiyon.
 * - AnalyzeEokulDataInput - analyzeEokulData fonksiyonu için giriş tipi.
 * - AnalyzeEokulDataOutput - analyzeEokulData fonksiyonu için dönüş tipi.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeEokulDataInputSchema = z.object({
  eokulData: z.string().describe('PDF dosyasından çıkarılan metin içeriği.'),
  examName: z.string().describe('Analiz edilen sınavın adı.'),
  studentName: z.string().describe('Öğrencinin adı.'),
  className: z.string().describe('Öğrencinin sınıfı.'),
});
export type AnalyzeEokulDataInput = z.infer<typeof AnalyzeEokulDataInputSchema>;

const AnalyzeEokulDataOutputSchema = z.object({
  analysis: z
    .string()
    .describe('E-Okul verilerinin analizini içeren detaylı rapor.'),
});
export type AnalyzeEokulDataOutput = z.infer<
  typeof AnalyzeEokulDataOutputSchema
>;

export async function analyzeEokulData(
  input: AnalyzeEokulDataInput
): Promise<AnalyzeEokulDataOutput> {
  return analyzeEokulDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeEokulDataPrompt',
  input: {schema: AnalyzeEokulDataInputSchema},
  output: {schema: AnalyzeEokulDataOutputSchema},
  prompt: `Sen bir uzman eğitim danışmanısın. Sana verilen E-Okul not dökümü metnini analiz ederek öğrencinin durumu hakkında detaylı bir rapor hazırla.

Analizinde aşağıdaki noktalara odaklan:
1.  **Genel Değerlendirme:** Öğrencinin genel akademik performansını özetle.
2.  **Güçlü Yönler:** Öğrencinin başarılı olduğu dersleri ve konuları belirt.
3.  **Geliştirilmesi Gereken Alanlar:** Öğrencinin zorlandığı dersleri veya notlarının düşük olduğu alanları tespit et.
4.  **Öneriler:** Öğrencinin başarısını artırmak için somut ve uygulanabilir önerilerde bulun (örn: "Matematik dersinde özellikle 'cebir' konularına daha fazla zaman ayırmalı.", "Türkçe dersindeki başarısını korumak için kitap okuma alışkanlığını sürdürmeli.").
5.  **Gelecek Potansiyeli:** Mevcut performansa göre öğrencinin LGS'deki potansiyelini değerlendir.

Raporu açık, anlaşılır ve yapıcı bir dille yaz.

Öğrenci Bilgileri:
- Ad: {{{studentName}}}
- Sınıf: {{{className}}}
- Sınav/Belge Adı: {{{examName}}}

Analiz Edilecek Metin:
{{{eokulData}}}

Lütfen sadece 'analysis' alanını doldurarak bir JSON çıktısı üret.`,
});

const analyzeEokulDataFlow = ai.defineFlow(
  {
    name: 'analyzeEokulDataFlow',
    inputSchema: AnalyzeEokulDataInputSchema,
    outputSchema: AnalyzeEokulDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    