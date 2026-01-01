"use client";

import { useState, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, Lightbulb, TrendingDown, Route, CheckCircle, GraduationCap, Users, User, ChevronDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { analyzeStudentReport, AnalyzeStudentReportOutput } from '@/ai/flows/analyze-student-report-flow';
import { analyzeClassReport, AnalyzeClassReportOutput } from '@/ai/flows/analyze-class-report-flow';
import { Label } from '@/components/ui/label';

type AnalysisResult = AnalyzeStudentReportOutput | AnalyzeClassReportOutput;

export default function AiAnalysisPage() {
  const { studentData, classes, exams, loading } = useData();
  const [analysisType, setAnalysisType] = useState('student');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudentNo, setSelectedStudentNo] = useState<string>('');
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const studentsInClass = useMemo(() => {
    if (!selectedClass) return [];
    return studentData
      .filter(s => s.class === selectedClass)
      .filter((s, i, arr) => arr.findIndex(t => t.student_no === s.student_no) === i)
      .sort((a,b) => a.student_name.localeCompare(b.student_name));
  }, [studentData, selectedClass]);

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
    setAnalysisResult(null);
  }

  const handleStudentChange = (studentNo: string) => {
    setSelectedStudentNo(studentNo);
    setAnalysisResult(null);
  }

  const handleExamChange = (exam: string) => {
    setAnalysisResult(null);
    setSelectedExams(prev => {
        if (exam === 'all') {
            const allExamNames = exams.map(e => e);
            return prev.length === allExamNames.length ? [] : allExamNames;
        }
        return prev.includes(exam) 
            ? prev.filter(e => e !== exam)
            : [...prev, exam];
    });
  }

  const selectedStudentName = useMemo(() => {
    const student = studentsInClass.find(s => s.student_no.toString() === selectedStudentNo);
    if (!student) return '';
    return `${student.student_name}`
  }, [studentsInClass, selectedStudentNo]);

  const examNameForTitle = useMemo(() => {
    if (selectedExams.length === 0) return "Deneme Seçilmedi";
    if (selectedExams.length === exams.length) return 'Tüm Denemeler';
    return selectedExams.join(', ');
  }, [selectedExams, exams]);


  const handleGenerate = async () => {
    if (!selectedClass || selectedExams.length === 0 || (analysisType === 'student' && !selectedStudentNo)) {
        toast({ title: "Lütfen tüm alanları doldurun.", variant: 'destructive' });
        return;
    }
    
    setIsGenerating(true);
    setAnalysisResult(null);

    try {
      let result: AnalysisResult;
      if (analysisType === 'student') {
        const studentResults = studentData
          .filter(s => s.student_no.toString() === selectedStudentNo && (selectedExams.includes(s.exam_name)));
        
        if (studentResults.length === 0) throw new Error("Öğrenci için seçili denemelerde sonuç bulunamadı.");

        result = await analyzeStudentReport({
            studentName: studentsInClass.find(s => s.student_no.toString() === selectedStudentNo)?.student_name || 'Bilinmeyen Öğrenci',
            className: selectedClass,
            examName: examNameForTitle,
            examResults: studentResults,
        });
      } else { // Class analysis
        const classResults = studentData.filter(d => 
            d.class === selectedClass && 
            (selectedExams.includes(d.exam_name))
        );
        if (classResults.length === 0) throw new Error("Sınıf için seçili denemelerde sonuç bulunamadı.");
        
        result = await analyzeClassReport({
            className: selectedClass,
            examName: examNameForTitle,
            examResults: classResults,
        });
      }
      setAnalysisResult(result);
      toast({ title: "AI Raporu başarıyla oluşturuldu." });
    } catch (error: any) {
        console.error("AI Analysis Error:", error);
        toast({ title: "Rapor oluşturulurken bir hata oluştu.", description: error.message, variant: 'destructive' });
    } finally {
        setIsGenerating(false);
    }
  }

  const renderAnalysisResult = () => {
    if (isGenerating) {
        return (
             <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-96">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>AI Raporu oluşturuluyor...</p>
                </div>
            </div>
        )
    }

    if (!analysisResult) {
        return (
             <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-96">
                <div className="flex flex-col items-center gap-1 text-center">
                    <BrainCircuit className="h-10 w-10 text-muted-foreground" />
                    <h3 className="text-2xl font-bold tracking-tight mt-4">
                        AI Analiz
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Analiz türü ve kriterleri seçerek yapay zeka destekli rapor oluşturun.
                    </p>
                </div>
            </div>
        )
    }

    const { summary, strengths, areasForImprovement, roadmap, recommendations } = analysisResult as any;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {analysisType === 'student' ? `${selectedStudentName} - AI Değerlendirmesi` : `${selectedClass} Sınıfı - AI Değerlendirmesi`}
                    </CardTitle>
                    <CardDescription>{examNameForTitle}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground p-4 bg-secondary/50 rounded-lg">{summary}</p>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/20 dark:border-green-800">
                            <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2 text-green-800 dark:text-green-300"><TrendingUp className="h-5 w-5"/>Güçlü Yönler</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm list-disc pl-5 text-green-900 dark:text-green-200">
                                    {strengths.map((item:string, index:number) => <li key={index} className="pl-2"><span>{item}</span></li>)}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-900/20 dark:border-orange-800">
                            <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2 text-orange-800 dark:text-orange-300"><AlertTriangle className="h-5 w-5"/>Geliştirilmesi Gerekenler</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm list-disc pl-5 text-orange-900 dark:text-orange-200">
                                    {areasForImprovement.map((item:string, index:number) => <li key={index} className="pl-2"><span>{item}</span></li>)}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>

            {roadmap && roadmap.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Route className="h-5 w-5 text-primary"/>Yol Haritası</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {roadmap.map((item:any, index:number) => (
                                <div key={index} className="flex items-start gap-4 p-3 bg-secondary/50 rounded-lg">
                                    <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">{index + 1}</div>
                                    <div><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground">{item.description}</p></div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {recommendations && recommendations.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary"/>Öneriler</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recommendations.map((item:any, index:number) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                                    <Lightbulb className="h-5 w-5 mt-1 text-yellow-500 shrink-0"/>
                                    <div><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground">{item.description}</p></div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="AI Analiz" description="Yapay zeka destekli öğrenci ve sınıf değerlendirmesi" />
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="w-full sm:w-auto flex-1">
                <Label>Analiz Türü</Label>
                <Select value={analysisType} onValueChange={handleAnalysisTypeChange}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="student">Öğrenci Analizi</SelectItem>
                        <SelectItem value="class">Sınıf Analizi</SelectItem>
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
                        <Button variant="outline" className="w-full justify-between" disabled={!selectedClass}>
                            Deneme Seçin ({selectedExams.length}) <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Deneme Sınavları</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked={selectedExams.length === exams.length} onCheckedChange={() => handleExamChange('all')}>Tüm Denemeler</DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        {exams.map(e => (
                            <DropdownMenuCheckboxItem key={e} checked={selectedExams.includes(e)} onCheckedChange={() => handleExamChange(e)}>{e}</DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating || !selectedClass} className="w-full sm:w-auto">
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                Analiz Oluştur
            </Button>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        {renderAnalysisResult()}
      </div>
    </div>
  );
}

    