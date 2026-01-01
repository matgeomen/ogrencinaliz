"use client";

import { useState } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateAiAssessmentReport } from '@/ai/flows/generate-ai-assessment-report';
import { analyzeEokulData } from '@/ai/flows/analyze-eokul-data';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { StudentExamResult } from '@/types';

export default function ReportsPage() {
  const { studentData, selectedExam, classes, loading } = useData();
  const [reportType, setReportType] = useState('student');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentExamResult | null>(null);
  const [eokulData, setEokulData] = useState('');
  
  const [assessmentReport, setAssessmentReport] = useState('');
  const [eokulAnalysis, setEokulAnalysis] = useState('');
  
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);
  const [isAnalyzingEokul, setIsAnalyzingEokul] = useState(false);
  const { toast } = useToast();

  const studentsInClass = studentData.filter(s => s.exam_name === selectedExam && s.class === selectedClass);

  const handleGenerateAssessment = async () => {
    setIsGeneratingAssessment(true);
    setAssessmentReport('');
    try {
      const input = {
        examName: selectedExam,
        studentData: reportType === 'student' && selectedStudent ? JSON.stringify(selectedStudent) : undefined,
        classData: reportType === 'class' && selectedClass ? JSON.stringify(studentData.filter(s => s.class === selectedClass && s.exam_name === selectedExam)) : undefined,
      };

      if (!input.studentData && !input.classData) {
        toast({ title: "Lütfen öğrenci veya sınıf seçin.", variant: "destructive" });
        return;
      }

      const result = await generateAiAssessmentReport(input);
      setAssessmentReport(result.report);
      toast({ title: "Rapor başarıyla oluşturuldu." });
    } catch (error) {
      toast({ title: "Rapor oluşturma başarısız oldu.", variant: "destructive" });
      console.error(error);
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  const handleAnalyzeEokul = async () => {
    if (!selectedStudent || !eokulData) {
      toast({ title: "Lütfen öğrenci seçin ve e-okul verisi girin.", variant: "destructive" });
      return;
    }
    setIsAnalyzingEokul(true);
    setEokulAnalysis('');
    try {
      const result = await analyzeEokulData({
        eokulData: eokulData,
        examName: "E-Okul Genel Durum",
        studentName: selectedStudent.student_name,
        className: selectedStudent.class
      });
      setEokulAnalysis(result.analysis);
      toast({ title: "E-okul analizi tamamlandı." });
    } catch (error) {
      toast({ title: "E-okul analizi başarısız oldu.", variant: "destructive" });
      console.error(error);
    } finally {
      setIsAnalyzingEokul(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Raporlar" description="Öğrenci ve sınıflar için özel raporlar ve analizler oluşturun." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI Değerlendirme Raporu</CardTitle>
            <CardDescription>Seçili deneme için öğrenci veya sınıf bazında yapay zeka destekli performans raporu oluşturun.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Öğrenci Raporu</SelectItem>
                  <SelectItem value="class">Sınıf Raporu</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedClass} onValueChange={c => { setSelectedClass(c); setSelectedStudent(null); }}>
                <SelectTrigger><SelectValue placeholder="Sınıf Seçin"/></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              
              {reportType === 'student' && (
                <Select value={selectedStudent?.student_no.toString()} onValueChange={s_no => setSelectedStudent(studentsInClass.find(s => s.student_no.toString() === s_no) || null)}>
                  <SelectTrigger disabled={!selectedClass}><SelectValue placeholder="Öğrenci Seçin"/></SelectTrigger>
                  <SelectContent>
                    {studentsInClass.map(s => <SelectItem key={s.student_no} value={s.student_no.toString()}>{s.student_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <Textarea value={assessmentReport} readOnly placeholder="Oluşturulan rapor burada görüntülenecektir." className="h-48 whitespace-pre-wrap" />
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateAssessment} disabled={isGeneratingAssessment || loading}>
              {isGeneratingAssessment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Değerlendirme Oluştur
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI E-Okul Veri Analizi</CardTitle>
            <CardDescription>Öğrencinin E-Okul verilerini girerek genel akademik durumu hakkında yapay zeka analizi alın.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Textarea value={eokulData} onChange={e => setEokulData(e.target.value)} placeholder="Öğrencinin e-okul not dökümünü buraya yapıştırın..." className="h-24" />
             <Textarea value={eokulAnalysis} readOnly placeholder="E-okul analizi burada görüntülenecektir." className="h-48 whitespace-pre-wrap" />
          </CardContent>
          <CardFooter>
            <Button onClick={handleAnalyzeEokul} disabled={isAnalyzingEokul || !selectedStudent}>
              {isAnalyzingEokul && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              E-Okul Verisini Analiz Et
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
