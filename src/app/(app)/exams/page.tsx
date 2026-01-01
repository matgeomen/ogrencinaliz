"use client";

import { useMemo, useState } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Users, TrendingUp, Eye, Trash2, X } from 'lucide-react';
import { StudentExamResult } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Separator } from '@/components/ui/separator';


interface ExamStats {
  exam_name: string;
  date: string;
  studentCount: number;
  avgScore: number;
  successRate: number;
}

const lessonKeys = [
  { key: 'turkce_net', name: 'Türkçe' },
  { key: 'mat_net', name: 'Matematik' },
  { key: 'fen_net', name: 'Fen Bilimleri' },
  { key: 'tarih_net', name: 'T.C. İnkılap Tarihi' },
  { key: 'din_net', name: 'Din Kültürü' },
  { key: 'ing_net', name: 'İngilizce' },
];

const CHART_COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042'
];


function ExamDetailModal({ examName }: { examName: string }) {
  const { studentData } = useData();

  const examResults = useMemo(() => {
    return studentData.filter(s => s.exam_name === examName);
  }, [studentData, examName]);

  const stats = useMemo(() => {
    const studentCount = examResults.length;
    if (studentCount === 0) {
      return { studentCount: 0, avgNet: 0, avgScore: 0, highestScore: 0 };
    }
    const totalNet = examResults.reduce((sum, s) => sum + s.toplam_net, 0);
    const totalScore = examResults.reduce((sum, s) => sum + s.toplam_puan, 0);
    const highestScore = Math.max(...examResults.map(s => s.toplam_puan));
    return {
      studentCount,
      avgNet: (totalNet / studentCount).toFixed(2),
      avgScore: (totalScore / studentCount).toFixed(2),
      highestScore: highestScore.toFixed(2),
    };
  }, [examResults]);

  const lessonAverages = useMemo(() => {
    const studentCount = examResults.length;
    if (studentCount === 0) return [];
    return lessonKeys.map(lesson => ({
      name: lesson.name,
      'Ort. Net': parseFloat((examResults.reduce((acc, s) => acc + (s[lesson.key as keyof StudentExamResult] as number), 0) / studentCount).toFixed(2)),
    }));
  }, [examResults]);
  
  const rankedStudents = useMemo(() => {
    return [...examResults]
      .sort((a, b) => b.toplam_puan - a.toplam_puan)
      .slice(0, 10); // Show top 10 or less
  }, [examResults]);

  return (
    <DialogContent className="sm:max-w-4xl">
       <DialogHeader>
         <DialogTitle className="text-2xl font-bold">{examName} - Detay</DialogTitle>
       </DialogHeader>
       <div className="py-4 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                    <p className="text-sm text-muted-foreground">Öğrenci</p>
                    <p className="text-2xl font-bold">{stats.studentCount}</p>
                </div>
                 <div>
                    <p className="text-sm text-muted-foreground">Ort. Net</p>
                    <p className="text-2xl font-bold">{stats.avgNet}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Ort. Puan</p>
                    <p className="text-2xl font-bold">{stats.avgScore}</p>
                </div>
                 <div>
                    <p className="text-sm text-muted-foreground">En Yüksek</p>
                    <p className="text-2xl font-bold text-primary">{stats.highestScore}</p>
                </div>
            </div>

            <Separator />

            <div>
                <h3 className="font-semibold text-lg mb-4 text-center">Ders Bazlı Ortalama Netler</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={lessonAverages}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                        />
                        <Bar dataKey="Ort. Net" radius={[4, 4, 0, 0]}>
                           {lessonAverages.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                           ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            <div>
                 <h3 className="font-semibold text-lg mb-4 text-center">Öğrenci Sıralaması</h3>
                 <div className="rounded-md border max-h-60 overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-secondary">
                            <TableRow>
                                <TableHead className="w-16">Sıra</TableHead>
                                <TableHead>No</TableHead>
                                <TableHead>Ad Soyad</TableHead>
                                <TableHead>Sınıf</TableHead>
                                <TableHead className="text-right">Net</TableHead>
                                <TableHead className="text-right">Puan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rankedStudents.map((student, index) => (
                                <TableRow key={student.student_no}>
                                    <TableCell className="font-medium">
                                        <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">{index + 1}</div>
                                    </TableCell>
                                    <TableCell>{student.student_no}</TableCell>
                                    <TableCell>{student.student_name}</TableCell>
                                    <TableCell>{student.class}</TableCell>
                                    <TableCell className="text-right">{student.toplam_net.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-semibold">{student.toplam_puan.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
       </div>
    </DialogContent>
  );
}


export default function ExamsPage() {
  const { studentData, exams, loading } = useData();

  const overallStats = useMemo(() => {
    const totalParticipation = exams.reduce((acc, examName) => {
        return acc + studentData.filter(s => s.exam_name === examName).length;
    }, 0);
    const totalScoreSum = studentData.reduce((sum, s) => sum + s.toplam_puan, 0);
    const totalEntries = studentData.length > 0 ? studentData.length : 1;
    
    return {
        examCount: exams.length,
        totalParticipation,
        generalAverage: (totalScoreSum / totalEntries)
    };
  }, [studentData, exams]);

  const examStats: ExamStats[] = useMemo(() => {
    return exams.map(examName => {
      const examResults = studentData.filter(s => s.exam_name === examName);
      const studentCount = examResults.length;
      if (studentCount === 0) {
        return { exam_name: examName, date: 'N/A', studentCount: 0, avgScore: 0, successRate: 0 };
      }
      const date = examResults[0]?.date || 'N/A';
      const totalScore = examResults.reduce((sum, s) => sum + s.toplam_puan, 0);
      const avgScore = totalScore / studentCount;
      const successRate = (avgScore / 500) * 100; // Assuming max score is 500
      return { exam_name: examName, date, studentCount, avgScore, successRate };
    });
  }, [studentData, exams]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Denemeler" 
        description={`${overallStats.examCount} deneme kayıtlı`} 
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Deneme</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-10" /> : overallStats.examCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Katılım</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : overallStats.totalParticipation}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genel Ortalama</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-24" /> : overallStats.generalAverage.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Deneme Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deneme Adı</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Öğrenci</TableHead>
                  <TableHead>Ort. Puan</TableHead>
                  <TableHead>Başarı</TableHead>
                  <TableHead className="text-center">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-6" /></TableCell>
                    </TableRow>
                  ))
                ) : examStats.length > 0 ? (
                  examStats.map((exam) => (
                    <Dialog key={exam.exam_name}>
                        <TableRow>
                          <TableCell className="font-medium">{exam.exam_name}</TableCell>
                          <TableCell>{exam.date !== 'N/A' ? new Date(exam.date).toLocaleDateString('tr-TR') : 'N/A'}</TableCell>
                          <TableCell>{exam.studentCount}</TableCell>
                          <TableCell>{exam.avgScore.toFixed(2)}</TableCell>
                          <TableCell>{`%${exam.successRate.toFixed(1)}`}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      <ExamDetailModal examName={exam.exam_name} />
                    </Dialog>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Hiç deneme bulunamadı. Lütfen "Veri Yükleme" sayfasından veri yükleyin.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
