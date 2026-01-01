// src/ai/flows/analyze-eokul-data.ts
'use server';
/**
 * @fileOverview Analyzes student E-okul data with AI to evaluate performance and generate insights.
 *
 * - analyzeEokulData - A function that analyzes E-okul data.
 * - AnalyzeEokulDataInput - The input type for the analyzeEokulData function.
 * - AnalyzeEokulDataOutput - The return type for the analyzeEokulData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeEokulDataInputSchema = z.object({
  eokulData: z.string().describe('The E-okul data of a student.'),
  examName: z.string().describe('The name of the exam.'),
  studentName: z.string().describe('The name of the student.'),
  className: z.string().describe('The class name of the student.'),
});
export type AnalyzeEokulDataInput = z.infer<typeof AnalyzeEokulDataInputSchema>;

const AnalyzeEokulDataOutputSchema = z.object({
  analysis: z.string().describe('The AI analysis of the E-okul data.'),
});
export type AnalyzeEokulDataOutput = z.infer<typeof AnalyzeEokulDataOutputSchema>;

export async function analyzeEokulData(input: AnalyzeEokulDataInput): Promise<AnalyzeEokulDataOutput> {
  return analyzeEokulDataFlow(input);
}

const analyzeEokulDataPrompt = ai.definePrompt({
  name: 'analyzeEokulDataPrompt',
  input: {schema: AnalyzeEokulDataInputSchema},
  output: {schema: AnalyzeEokulDataOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing student E-okul data.

  Analyze the following E-okul data for student {{studentName}} in class {{className}}, related to the exam {{examName}} and provide insights on the student's performance. Give specific feedback and recommendations. Focus on strengths and areas for improvement.

  E-okul Data: {{{eokulData}}}
  `,
});

const analyzeEokulDataFlow = ai.defineFlow(
  {
    name: 'analyzeEokulDataFlow',
    inputSchema: AnalyzeEokulDataInputSchema,
    outputSchema: AnalyzeEokulDataOutputSchema,
  },
  async input => {
    const {output} = await analyzeEokulDataPrompt(input);
    return output!;
  }
);
