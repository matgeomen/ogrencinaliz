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
import { FileText, Users, Home, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    
    const studentsInClass = useMemo(() => {
        return studentData
            .filter(s => s.class === selectedClass)
            .filter((s, i, arr) => arr.findIndex(t => t.student_no === s.student_no) === i);
    }, [studentData, selectedClass]);
    
    const selectedStudentResults = useMemo(() => {
        if (!selectedStudentNo) return [];
        return studentData
            .filter(s => s.student_no.toString() === selectedStudentNo)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [studentData, selectedStudentNo]);

    const handleGenerate = () => {
        if (!selectedStudentNo) {
            alert("Lütfen bir öğrenci seçin.");
            return;
        }
        setIsGenerating(true);
        // Simulate report generation
        setTimeout(() => {
            setIsGenerating(false);
        }, 1500);
    }
    
    const selectedStudentName = studentsInClass.find(s => s.student_no.toString() === selectedStudentNo)?.student_name;

    return (
        <div>
            <Card>
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                    <Select value={selectedClass} onValueChange={c => { setSelectedClass(c); setSelectedStudentNo(''); }}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Sınıf Seçin"/></SelectTrigger>
                        <SelectContent>
                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Select value={selectedStudentNo} onValueChange={setSelectedStudentNo} disabled={!selectedClass}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Öğrenci Seçin"/></SelectTrigger>
                        <SelectContent>
                        {studentsInClass.map(s => <SelectItem key={s.student_no} value={s.student_no.toString()}>{s.student_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Button onClick={handleGenerate} disabled={isGenerating || !selectedStudentNo} className="w-full sm:w-auto">
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Oluştur
                    </Button>
                </CardContent>
            </Card>

            {selectedStudentResults.length > 0 && (
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

function PlaceholderReport({ title, description }: { title: string, description: string}) {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-64">
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
      <PageHeader title="Raporlar" description="AI destekli öğrenci ve sınıf raporları" />

      <div className="grid gap-4 md:grid-cols-3">
        {reportTypes.map(type => (
            <Card 
                key={type.id} 
                className={cn("cursor-pointer hover:shadow-lg transition-shadow", activeTab === type.id && "ring-2 ring-primary")}
                onClick={() => setActiveTab(type.id)}
            >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="bg-muted p-3 rounded-lg">
                        <type.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>{type.title}</CardTitle>
                        <CardDescription>{type.description}</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        ))}
      </div>

      <div className="mt-6">
          {activeTab === 'student' && <StudentReport />}
          {activeTab === 'class' && <PlaceholderReport title="Sınıf Raporu" description="Bu özellik yakında aktif olacaktır." />}
          {activeTab === 'parent' && <PlaceholderReport title="Veli Raporu" description="Bu özellik yakında aktif olacaktır." />}
      </div>
    </div>
  );
}
