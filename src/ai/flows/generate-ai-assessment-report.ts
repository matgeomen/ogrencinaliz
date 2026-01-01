'use server';

/**
 * @fileOverview Generates an AI assessment report for a selected student or class.
 *
 * - generateAiAssessmentReport - A function that generates the AI assessment report.
 * - GenerateAiAssessmentReportInput - The input type for the generateAiAssessmentReport function.
 * - GenerateAiAssessmentReportOutput - The return type for the generateAiAssessmentReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAiAssessmentReportInputSchema = z.object({
  studentData: z.string().optional().describe('The student data in JSON format, if a specific student is selected.'),
  classData: z.string().optional().describe('The class data in JSON format, if a specific class is selected.'),
  examName: z.string().describe('The name of the exam for which the report is generated.'),
});

export type GenerateAiAssessmentReportInput = z.infer<typeof GenerateAiAssessmentReportInputSchema>;

const GenerateAiAssessmentReportOutputSchema = z.object({
  report: z.string().describe('The AI-generated assessment report.'),
});

export type GenerateAiAssessmentReportOutput = z.infer<typeof GenerateAiAssessmentReportOutputSchema>;

export async function generateAiAssessmentReport(input: GenerateAiAssessmentReportInput): Promise<GenerateAiAssessmentReportOutput> {
  return generateAiAssessmentReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAiAssessmentReportPrompt',
  input: {schema: GenerateAiAssessmentReportInputSchema},
  output: {schema: GenerateAiAssessmentReportOutputSchema},
  prompt: `You are an AI assistant that generates assessment reports for students or classes based on their exam data.

  {% if studentData %}
  Generate a report for the student with the following data: {{{studentData}}}
  {% elif classData %}
  Generate a report for the class with the following data: {{{classData}}}
  {% else %}
  No student or class data provided. Please provide either student or class data.
  {% endif %}

The report should include:
  - Strengths of the student/class
  - Weaknesses of the student/class
  - Areas needing improvement
  - Suggestions for improvement

The exam name is: {{{examName}}}

Ensure the report is comprehensive and insightful.
`,
});

const generateAiAssessmentReportFlow = ai.defineFlow(
  {
    name: 'generateAiAssessmentReportFlow',
    inputSchema: GenerateAiAssessmentReportInputSchema,
    outputSchema: GenerateAiAssessmentReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
