"use client";

import { useState, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, Lightbulb, TrendingUp, AlertTriangle, Route, ChevronDown, User, Users, CheckCircle, TrendingDown } from 'lucide-react';
import { analyzeStudentReport, AnalyzeStudentReportOutput } from '@/ai/flows/analyze-student-report-flow';
import { analyzeClassReport, AnalyzeClassReportOutput } from '@/ai/flows/analyze-class-report-flow';
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StudentExamResult } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type AnalysisResult = AnalyzeStudentReportOutput | AnalyzeClassReportOutput | null;

const getStatus = (score: number): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    if (score >= 400) return { label: 'Çok İyi', variant: 'default' };
    if (score >= 300) return { label: 'İyi', variant: 'secondary' };
    if (score >= 200) return { label: 'Orta', variant: 'outline' };
    return { label: 'Zayıf', variant: 'destructive' };
};

export default function AiAnalysisPage() {
  const { studentData, classes, exams, loading } = useData();
  const [analysisType, setAnalysisType] = useState('student');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudentNo, setSelectedStudentNo] = useState<string>('');
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(null);
  const { toast } = useToast();

  const studentsInClass = useMemo(() => {
    return studentData
      .filter(s => s.class === selectedClass)
      .filter((s, i, arr) => arr.findIndex(t => t.student_no === s.student_no) === i)
      .sort((a, b) => a.student_name.localeCompare(b.student_name));
  }, [studentData, selectedClass]);
  
  const availableExams = useMemo(() => {
    if (analysisType === 'student' && selectedStudentNo) {
      const studentExams = new Set(studentData.filter(s => s.student_no.toString() === selectedStudentNo).map(s => s.exam_name));
      return exams.filter(e => studentExams.has(e));
    }
    if (analysisType === 'class' && selectedClass) {
      const classExams = new Set(studentData.filter(s => s.class === selectedClass).map(s => s.exam_name));
      return exams.filter(e => classExams.has(e));
    }
    return exams;
  }, [studentData, exams, analysisType, selectedClass, selectedStudentNo]);

  const examNameForTitle = useMemo(() => {
    if (selectedExams.length === 0) return "Deneme Seçilmedi";
    if (selectedExams.length === availableExams.length) return 'Tüm Denemeler';
    return selectedExams.join(', ');
  }, [selectedExams, availableExams]);
  
  const selectedResults: StudentExamResult[] = useMemo(() => {
    if (selectedExams.length === 0 || !selectedClass) return [];
    if (analysisType === 'student' && !selectedStudentNo) return [];

    return studentData
      .filter(d => 
        selectedExams.includes(d.exam_name) &&
        d.class === selectedClass &&
        (analysisType === 'class' || d.student_no.toString() === selectedStudentNo)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [studentData, analysisType, selectedClass, selectedStudentNo, selectedExams]);


  const handleAnalysisTypeChange = (type: string) => {
    setAnalysisType(type);
    setSelectedClass('');
    setSelectedStudentNo('');
    setSelectedExams([]);
    setAnalysisResult(null);
  }

  const handleClassChange = (c: string) => {
    setSelectedClass(c);
    setSelectedStudentNo('');
    setSelectedExams([]);
    setAnalysisResult(null);
  }

  const handleStudentChange = (studentNo: string) => {
    setSelectedStudentNo(studentNo);
    setSelectedExams([]);
    setAnalysisResult(null);
  }

  const handleExamChange = (exam: string) => {
    setAnalysisResult(null);
    setSelectedExams(prev => {
      if (exam === 'all') {
        return prev.length === availableExams.length ? [] : availableExams;
      }
      return prev.includes(exam)
        ? prev.filter(e => e !== exam)
        : [...prev, exam];
    });
  }

  const handleGenerate = async () => {
    if (selectedResults.length === 0) {
      toast({ title: "Lütfen tüm alanları doldurun ve veri olduğundan emin olun.", variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setAnalysisResult(null);

    try {
      if (analysisType === 'student') {
        const studentName = studentsInClass.find(s => s.student_no.toString() === selectedStudentNo)?.student_name || 'Bilinmeyen Öğrenci';
        const result = await analyzeStudentReport({
          studentName,
          className: selectedClass,
          examName: examNameForTitle,
          examResults: selectedResults,
        });
        setAnalysisResult(result);
      } else { // Class analysis
        const result = await analyzeClassReport({
          className: selectedClass,
          examName: examNameForTitle,
          examResults: selectedResults,
        });
        setAnalysisResult(result);
      }
      toast({ title: "AI Analizi başarıyla oluşturuldu." });
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      const errorMessage = error.message?.toLowerCase() || '';
      if (errorMessage.includes('api key not found') || errorMessage.includes('api key expired')) {
         toast({
            title: "AI API Anahtarı Geçersiz veya Süresi Dolmuş",
            description: (
              <span>
                Lütfen AI özelliklerini kullanmak için Ayarlar sayfasından API anahtarınızı yenileyin veya girin. 
                <Link href="/settings" className="underline font-semibold ml-1">Ayarlara Git</Link>
              </span>
            ),
            variant: "destructive",
            duration: 10000,
          });
      } else {
        toast({ title: "Analiz oluşturulurken bir hata oluştu.", description: error.message, variant: 'destructive' });
      }
    } finally {
      setIsGenerating(false);
    }
  }

  const renderStudentResultsTable = () => (
     <Card>
        <CardHeader>
            <CardTitle>{studentsInClass.find(s => s.student_no.toString() === selectedStudentNo)?.student_name} - Seçilen Sonuçlar</CardTitle>
            <CardDescription>{examNameForTitle}</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Deneme</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead className="text-right">Puan</TableHead>
                        <TableHead className="text-center">Durum</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {selectedResults.map(result => {
                        const status = getStatus(result.toplam_puan);
                        return (
                            <TableRow key={result.exam_name}>
                                <TableCell className="font-medium">{result.exam_name}</TableCell>
                                <TableCell className="text-right font-medium">{result.toplam_net.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-bold text-primary">{result.toplam_puan.toFixed(2)}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={status.variant} className={cn(
                                        status.label === 'Çok İyi' && 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
                                        status.label === 'İyi' && 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
                                        status.label === 'Orta' && 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
                                        status.label === 'Zayıf' && 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                                    )}>{status.label}</Badge>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
  )

  const renderClassResultsTable = () => (
     <Card>
        <CardHeader>
            <CardTitle>{selectedClass} Sınıfı - Seçilen Sonuçlar</CardTitle>
            <CardDescription>{examNameForTitle}</CardDescription>
        </CardHeader>
        <CardContent>
             <div className="max-h-96 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Öğrenci</TableHead>
                            <TableHead>Deneme</TableHead>
                            <TableHead className="text-right">Net</TableHead>
                            <TableHead className="text-right">Puan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {selectedResults.map((result, index) => (
                            <TableRow key={`${result.student_no}-${result.exam_name}-${index}`}>
                                <TableCell>{result.student_name}</TableCell>
                                <TableCell>{result.exam_name}</TableCell>
                                <TableCell className="text-right">{result.toplam_net.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-semibold">{result.toplam_puan.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
  )


  const renderStudentReport = (result: AnalyzeStudentReportOutput) => (
    <>
      {renderStudentResultsTable()}
      <Card>
        <CardHeader>
            <CardTitle>{studentsInClass.find(s => s.student_no.toString() === selectedStudentNo)?.student_name} - AI Değerlendirmesi</CardTitle>
            <CardDescription>{examNameForTitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{result.summary}</p>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/20 dark:border-green-800">
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-green-800 dark:text-green-300">
                    <TrendingUp className="h-5 w-5"/>
                    Güçlü Yönler
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm text-green-900 dark:text-green-200">
                    {result.strengths.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 shrink-0"/>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-900/20 dark:border-orange-800">
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-orange-800 dark:text-orange-300">
                    <TrendingDown className="h-5 w-5"/>
                    Geliştirilmesi Gerekenler
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm text-orange-900 dark:text-orange-200">
                    {result.areasForImprovement.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-600 shrink-0"/>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-6 w-6 text-primary" />
            Yol Haritası
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.roadmap.map((item, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
              <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">{index + 1}</div>
              <div>
                 <p className="font-semibold">{item.title}</p>
                 <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
  
  const renderClassReport = (result: AnalyzeClassReportOutput) => (
    <>
      {renderClassResultsTable()}
      <Card>
        <CardHeader>
          <CardTitle>{selectedClass} Sınıfı - AI Değerlendirmesi</CardTitle>
          <CardDescription>{examNameForTitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{result.summary}</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/20 dark:border-green-800">
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-green-800 dark:text-green-300">
                    <TrendingUp className="h-5 w-5"/>
                    Güçlü Yönler
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm text-green-900 dark:text-green-200">
                    {result.strengths.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 shrink-0"/>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-900/20 dark:border-orange-800">
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-orange-800 dark:text-orange-300">
                    <TrendingDown className="h-5 w-5"/>
                    Geliştirilmesi Gerekenler
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm text-orange-900 dark:text-orange-200">
                    {result.areasForImprovement.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-600 shrink-0"/>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-6 w-6 text-primary" />
            Yol Haritası
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.roadmap.map((item, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
              <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">{index + 1}</div>
              <div>
                 <p className="font-semibold">{item.title}</p>
                 <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );

  const renderInitialContent = () => {
    if (selectedResults.length > 0) {
      if (analysisType === 'student') {
        return renderStudentResultsTable();
      }
      if (analysisType === 'class') {
         return renderClassResultsTable();
      }
    }

    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-96">
        <div className="flex flex-col items-center gap-1 text-center">
          <BrainCircuit className="h-10 w-10 text-muted-foreground" />
          <h3 className="text-2xl font-bold tracking-tight mt-4">
            AI Destekli Analiz
          </h3>
          <p className="text-sm text-muted-foreground">
            Analiz türü seçerek başlayın ve yapay zeka destekli raporlar oluşturun.
          </p>
        </div>
      </div>
    );
  }

  const renderAnalysisResult = () => {
    if (isGenerating) {
      return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-96">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>AI Analizi oluşturuluyor...</p>
          </div>
        </div>
      )
    }

    if (!analysisResult) {
        return renderInitialContent();
    }

    if (analysisType === 'student') {
      return renderStudentReport(analysisResult as AnalyzeStudentReportOutput);
    } else {
      return renderClassReport(analysisResult as AnalyzeClassReportOutput);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <PageHeader title="AI Analiz" description="Yapay zeka destekli sınıf ve öğrenci değerlendirmesi" />
      </div>
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:w-auto flex-1">
                <Label>Analiz Türü</Label>
                <Select value={analysisType} onValueChange={handleAnalysisTypeChange}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="student"><User className="mr-2 h-4 w-4 inline-block"/>Öğrenci Analizi</SelectItem>
                        <SelectItem value="class"><Users className="mr-2 h-4 w-4 inline-block"/>Sınıf Analizi</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <div className="w-full sm:w-auto flex-1">
                <Label>Sınıf</Label>
                <Select value={selectedClass} onValueChange={handleClassChange} disabled={loading}>
                    <SelectTrigger><SelectValue placeholder="Sınıf Seçin"/></SelectTrigger>
                    <SelectContent>
                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            
            {analysisType === 'student' && (
                <div className="w-full sm:w-auto flex-1">
                    <Label>Öğrenci</Label>
                    <Select value={selectedStudentNo} onValueChange={handleStudentChange} disabled={!selectedClass}>
                        <SelectTrigger><SelectValue placeholder="Öğrenci Seçin"/></SelectTrigger>
                        <SelectContent>
                            {studentsInClass.map(s => <SelectItem key={s.student_no} value={s.student_no.toString()}>{s.student_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}

             <div className="w-full sm:w-auto flex-1">
                <Label>Denemeler</Label>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between" disabled={!selectedClass || (analysisType === 'student' && !selectedStudentNo)}>
                            Deneme Seçin ({selectedExams.length}) <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Deneme Sınavları</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked={selectedExams.length === availableExams.length && availableExams.length > 0} onCheckedChange={() => handleExamChange('all')}>Tüm Denemeler</DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        {availableExams.map(e => (
                            <DropdownMenuCheckboxItem key={e} checked={selectedExams.includes(e)} onCheckedChange={() => handleExamChange(e)}>{e}</DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating || selectedResults.length === 0} className="w-full sm:w-auto">
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                Analiz Oluştur
            </Button>
        </CardContent>
      </Card>
      
      <div className="mt-6 space-y-6">
        {renderAnalysisResult()}
      </div>
    </div>
  );
}

    