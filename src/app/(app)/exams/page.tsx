"use client";

import { useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Users, TrendingUp, Eye, Trash2 } from 'lucide-react';

interface ExamStats {
  exam_name: string;
  date: string;
  studentCount: number;
  avgScore: number;
  successRate: number;
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
                    <TableRow key={exam.exam_name}>
                      <TableCell className="font-medium">{exam.exam_name}</TableCell>
                      <TableCell>{exam.date !== 'N/A' ? new Date(exam.date).toLocaleDateString('tr-TR') : 'N/A'}</TableCell>
                      <TableCell>{exam.studentCount}</TableCell>
                      <TableCell>{exam.avgScore.toFixed(2)}</TableCell>
                      <TableCell>{`%${exam.successRate.toFixed(1)}`}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
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
