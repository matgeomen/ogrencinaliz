"use client";

import { useState, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, Lightbulb, ChevronDown } from 'lucide-react';
import { analyzeClassReport, AnalyzeClassReportOutput } from '@/ai/flows/analyze-class-report-flow';
import { Label } from '@/components/ui/label';

export default function AiAnalysisPage() {
  const { studentData, classes, exams, loading } = useData();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeClassReportOutput | null>(null);
  const { toast } = useToast();

  const handleClassChange = (c: string) => {
    setSelectedClass(c);
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

  const examNameForTitle = useMemo(() => {
    if (selectedExams.length === 0) return "Deneme Seçilmedi";
    if (selectedExams.length === exams.length) return 'Tüm Denemeler';
    return selectedExams.join(', ');
  }, [selectedExams, exams]);


  const handleGenerate = async () => {
    if (!selectedClass || selectedExams.length === 0) {
        toast({ title: "Lütfen sınıf ve deneme seçin.", variant: 'destructive' });
        return;
    }
    
    setIsGenerating(true);
    setAnalysisResult(null);

    try {
        const classResults = studentData.filter(d => 
            d.class === selectedClass && 
            (selectedExams.includes(d.exam_name))
        );
        if (classResults.length === 0) throw new Error("Sınıf için seçili denemelerde sonuç bulunamadı.");
        
        const result = await analyzeClassReport({
            className: selectedClass,
            examName: examNameForTitle,
            examResults: classResults,
        });
      
      setAnalysisResult(result);
      toast({ title: "AI Önerileri başarıyla oluşturuldu." });
    } catch (error: any) {
        console.error("AI Analysis Error:", error);
        toast({ title: "Öneriler oluşturulurken bir hata oluştu.", description: error.message, variant: 'destructive' });
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
                    <p>AI Önerileri oluşturuluyor...</p>
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
                        AI Destekli Öneriler
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Sınıf ve deneme seçerek yapay zeka destekli öneriler oluşturun.
                    </p>
                </div>
            </div>
        )
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-6 w-6 text-primary" />
                    Öneriler
                </CardTitle>
                <CardDescription>
                    {`${selectedClass} sınıfı için "${examNameForTitle}" sonuçlarına dayalı öneriler.`}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {analysisResult.recommendations.map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                        <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full p-2">
                            <Lightbulb className="h-5 w-5" />
                        </div>
                        <div className="pt-1">
                            <p className="text-sm text-foreground">
                                <strong className="font-semibold">{item.title}:</strong> {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <PageHeader title="AI Analiz" description="Yapay zeka destekli sınıf ve öğrenci değerlendirmesi" />
      </div>
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:w-auto flex-1">
                <Label>Sınıf</Label>
                <Select value={selectedClass} onValueChange={handleClassChange} disabled={loading}>
                    <SelectTrigger><SelectValue placeholder="Sınıf Seçin"/></SelectTrigger>
                    <SelectContent>
                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
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
                Öneri Oluştur
            </Button>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        {renderAnalysisResult()}
      </div>
    </div>
  );
}
