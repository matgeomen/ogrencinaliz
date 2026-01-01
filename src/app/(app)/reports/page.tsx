"use client";

import { useState, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StudentExamResult } from '@/types';
import { FileText, Users, Home, Loader2, Printer, BrainCircuit, Lightbulb, TrendingDown, Route, CheckCircle, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeStudentReport, AnalyzeStudentReportOutput } from '@/ai/flows/analyze-student-report-flow';
import { analyzeClassReport, AnalyzeClassReportOutput } from '@/ai/flows/analyze-class-report-flow';
import { useToast } from '@/hooks/use-toast';

const getStatus = (score: number): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    if (score >= 400) return { label: 'Çok İyi', variant: 'default' };
    if (score >= 300) return { label: 'İyi', variant: 'secondary' };
    if (score >= 200) return { label: 'Orta', variant: 'outline' };
    return { label: 'Zayıf', variant: 'destructive' };
};

function StudentReport() {
    const { studentData, classes } = useData();
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedStudentNo, setSelectedStudentNo] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<AnalyzeStudentReportOutput | null>(null);
    const { toast } = useToast();
    
    const studentsInClass = useMemo(() => {
        return studentData
            .filter(s => s.class === selectedClass)
            .filter((s, i, arr) => arr.findIndex(t => t.student_no === s.student_no) === i)
            .sort((a,b) => a.student_name.localeCompare(b.student_name));
    }, [studentData, selectedClass]);
    
    const selectedStudentResults = useMemo(() => {
        if (!selectedStudentNo) return [];
        return studentData
            .filter(s => s.student_no.toString() === selectedStudentNo)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [studentData, selectedStudentNo]);

    const handleGenerate = async () => {
        if (!selectedStudentNo || selectedStudentResults.length === 0) {
            toast({ title: "Lütfen bir öğrenci ve verisi olduğundan emin olun.", variant: 'destructive' });
            return;
        }
        setIsGenerating(true);
        setAiAnalysis(null);
        
        try {
            const result = await analyzeStudentReport({
                studentName: selectedStudentName || 'Bilinmeyen Öğrenci',
                className: selectedClass,
                examResults: selectedStudentResults,
            });
            setAiAnalysis(result);
            toast({ title: "AI Raporu başarıyla oluşturuldu." });
        } catch (error) {
            console.error("AI Analysis Error:", error);
            toast({ title: "Rapor oluşturulurken bir hata oluştu.", variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    }
    
    const selectedStudentName = studentsInClass.find(s => s.student_no.toString() === selectedStudentNo)?.student_name;

    const handleClassChange = (c: string) => {
        setSelectedClass(c);
        setSelectedStudentNo('');
        setAiAnalysis(null);
    }
    const handleStudentChange = (studentNo: string) => {
        setSelectedStudentNo(studentNo);
        setAiAnalysis(null);
    }

    return (
        <div className="report-section">
            <Card className="no-print">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                    <Select value={selectedClass} onValueChange={handleClassChange}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Sınıf Seçin"/></SelectTrigger>
                        <SelectContent>
                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Select value={selectedStudentNo} onValueChange={handleStudentChange} disabled={!selectedClass}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Öğrenci Seçin"/></SelectTrigger>
                        <SelectContent>
                        {studentsInClass.map(s => <SelectItem key={s.student_no} value={s.student_no.toString()}>{s.student_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Button onClick={handleGenerate} disabled={isGenerating || !selectedStudentNo} className="w-full sm:w-auto">
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                        Rapor Oluştur
                    </Button>
                </CardContent>
            </Card>

            {isGenerating && (
                <div className="mt-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>AI Raporu oluşturuluyor...</p>
                </div>
            )}

            {aiAnalysis && (
                 <div className="mt-6 space-y-6 print-container">
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>{selectedStudentName} - AI Değerlendirme Raporu</CardTitle>
                                <Button variant="outline" size="sm" onClick={() => window.print()} className="no-print">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Yazdır
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-sm text-muted-foreground">{aiAnalysis.summary}</p>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/20 dark:border-green-800">
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-green-800 dark:text-green-300">
                                            <Lightbulb className="h-5 w-5"/>
                                            Güçlü Yönler
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-green-900 dark:text-green-200">
                                            {aiAnalysis.strengths.map((item, index) => (
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
                                            {aiAnalysis.areasForImprovement.map((item, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <TrendingDown className="h-4 w-4 mt-0.5 text-orange-600 shrink-0"/>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>

                    {aiAnalysis.roadmap && aiAnalysis.roadmap.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Route className="h-5 w-5 text-primary"/>
                                    Yol Haritası
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {aiAnalysis.roadmap.map((item, index) => (
                                        <div key={index} className="flex items-start gap-4 p-3 bg-secondary/50 rounded-lg">
                                            <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">{index + 1}</div>
                                            <div>
                                                <p className="font-semibold">{item.title}</p>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-primary"/>
                                    Öneriler
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {aiAnalysis.recommendations.map((item, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                                             <Lightbulb className="h-5 w-5 mt-1 text-yellow-500 shrink-0"/>
                                            <div>
                                                <p className="font-semibold">{item.title}</p>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                 </div>
            )}

            {selectedStudentResults.length > 0 && !aiAnalysis && !isGenerating && (
                 <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>{selectedStudentName} - Tüm Deneme Sonuçları</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="relative w-full overflow-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Deneme</TableHead>
                                        <TableHead className="text-right">Türkçe</TableHead>
                                        <TableHead className="text-right">Mat</TableHead>
                                        <TableHead className="text-right">Fen</TableHead>
                                        <TableHead className="text-right">Tarih</TableHead>
                                        <TableHead className="text-right">Din</TableHead>
                                        <TableHead className="text-right">İng</TableHead>
                                        <TableHead className="text-right font-semibold">T.Net</TableHead>
                                        <TableHead className="text-right font-semibold">Puan</TableHead>
                                        <TableHead className="text-center">Durum</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedStudentResults.map(result => {
                                        const status = getStatus(result.toplam_puan);
                                        return (
                                            <TableRow key={result.exam_name}>
                                                <TableCell className="font-medium">{result.exam_name}</TableCell>
                                                <TableCell className="text-right">{result.turkce_net.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">{result.mat_net.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">{result.fen_net.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">{result.tarih_net.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">{result.din_net.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">{result.ing_net.toFixed(2)}</TableCell>
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
                        </div>
                    </CardContent>
                 </Card>
            )}
        </div>
    );
}

function ClassReport() {
    const { studentData, classes, exams } = useData();
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedExam, setSelectedExam] = useState<string>('all');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<AnalyzeClassReportOutput | null>(null);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!selectedClass) {
            toast({ title: "Lütfen bir sınıf seçin.", variant: 'destructive' });
            return;
        }
        setIsGenerating(true);
        setAiAnalysis(null);

        const classData = studentData.filter(d => 
            d.class === selectedClass && 
            (selectedExam === 'all' || d.exam_name === selectedExam)
        );

        if (classData.length === 0) {
            toast({ title: "Seçilen sınıf veya deneme için veri bulunamadı.", variant: 'destructive' });
            setIsGenerating(false);
            return;
        }
        
        try {
            const result = await analyzeClassReport({
                className: selectedClass,
                examName: selectedExam === 'all' ? 'Tüm Denemeler' : selectedExam,
                examResults: classData,
            });
            setAiAnalysis(result);
            toast({ title: "Sınıf Raporu başarıyla oluşturuldu." });
        } catch (error) {
            console.error("AI Class Analysis Error:", error);
            toast({ title: "Sınıf raporu oluşturulurken bir hata oluştu.", variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    }

    const handleClassChange = (c: string) => {
        setSelectedClass(c);
        setAiAnalysis(null);
    }
     const handleExamChange = (e: string) => {
        setSelectedExam(e);
        setAiAnalysis(null);
    }

    return (
         <div className="report-section">
            <Card className="no-print">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                    <Select value={selectedClass} onValueChange={handleClassChange}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Sınıf Seçin"/></SelectTrigger>
                        <SelectContent>
                            {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Select value={selectedExam} onValueChange={handleExamChange}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Deneme (Opsiyonel)"/></SelectTrigger>
                        <SelectContent>
                             <SelectItem value='all'>Tüm Denemeler</SelectItem>
                            {exams.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Button onClick={handleGenerate} disabled={isGenerating || !selectedClass} className="w-full sm:w-auto">
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                        Rapor Oluştur
                    </Button>
                </CardContent>
            </Card>

            {isGenerating && (
                <div className="mt-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>AI Sınıf Raporu oluşturuluyor...</p>
                </div>
            )}

            {aiAnalysis && (
                 <div className="mt-6 space-y-6 print-container">
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>{selectedClass} Sınıfı - AI Raporu</CardTitle>
                                <Button variant="outline" size="sm" onClick={() => window.print()} className="no-print">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Yazdır
                                </Button>
                            </div>
                             <CardDescription>{selectedExam === 'all' ? "Tüm Denemeler" : selectedExam}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className='p-4 bg-secondary/50 rounded-lg'>
                                <h3 className='font-semibold flex items-center gap-2 mb-2'><BrainCircuit className='h-5 w-5 text-primary' /> Genel Değerlendirme</h3>
                                <p className="text-sm text-muted-foreground">{aiAnalysis.summary}</p>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/20 dark:border-green-800">
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-green-800 dark:text-green-300">
                                            <Lightbulb className="h-5 w-5"/>
                                            Güçlü Yönler
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-green-900 dark:text-green-200">
                                            {aiAnalysis.strengths.map((item, index) => (
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
                                            {aiAnalysis.areasForImprovement.map((item, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <TrendingDown className="h-4 w-4 mt-0.5 text-orange-600 shrink-0"/>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>

                    {aiAnalysis.roadmap && aiAnalysis.roadmap.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Route className="h-5 w-5 text-primary"/>
                                    Yol Haritası
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {aiAnalysis.roadmap.map((item, index) => (
                                        <div key={index} className="flex items-start gap-4 p-3 bg-secondary/50 rounded-lg">
                                            <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">{index + 1}</div>
                                            <div>
                                                <p className="font-semibold">{item.title}</p>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-primary"/>
                                    Öneriler
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {aiAnalysis.recommendations.map((item, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                                             <Lightbulb className="h-5 w-5 mt-1 text-yellow-500 shrink-0"/>
                                            <div>
                                                <p className="font-semibold">{item.title}</p>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                 </div>
            )}
        </div>
    );
}


function PlaceholderReport({ title, description }: { title: string, description: string}) {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-64 mt-6">
            <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
                {title}
            </h3>
            <p className="text-sm text-muted-foreground">
                {description}
            </p>
            </div>
      </div>
    )
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('student');

  const reportTypes = [
      { id: 'student', title: 'Öğrenci Karnesi', description: 'Bireysel performans', icon: FileText },
      { id: 'class', title: 'Sınıf Raporu', description: 'Sınıf geneli', icon: Users },
      { id: 'parent', title: 'Veli Raporu', description: 'Veli için özet', icon: Home },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Raporlar" description="AI destekli öğrenci ve sınıf raporları" className="no-print" />

      <div className="grid gap-4 md:grid-cols-3 no-print">
        {reportTypes.map(type => (
            <Card 
                key={type.id} 
                className={cn("cursor-pointer hover:shadow-lg transition-shadow", activeTab === type.id && "ring-2 ring-primary")}
                onClick={() => setActiveTab(type.id)}
            >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                    <div className="bg-muted p-3 rounded-lg">
                        <type.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className='text-base font-semibold'>{type.title}</CardTitle>
                        <CardDescription className='text-xs'>{type.description}</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        ))}
      </div>

      <div className="mt-6">
          {activeTab === 'student' && <StudentReport />}
          {activeTab === 'class' && <ClassReport />}
          {activeTab === 'parent' && <PlaceholderReport title="Veli Raporu" description="Bu özellik yakında aktif olacaktır." />}
      </div>
    </div>
  );
}
