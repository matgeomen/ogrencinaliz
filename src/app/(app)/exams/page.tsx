"use client";

import { useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExamStats } from '@/types';

export default function ExamsPage() {
  const { studentData, exams, loading } = useData();

  const examStats: ExamStats[] = useMemo(() => {
    return exams.map(examName => {
      const examResults = studentData.filter(s => s.exam_name === examName);
      const studentCount = examResults.length;
      if (studentCount === 0) {
        return { exam_name: examName, date: '', studentCount: 0, avgScore: 0 };
      }
      const date = examResults[0].date;
      const totalScore = examResults.reduce((sum, s) => sum + s.toplam_puan, 0);
      const avgScore = totalScore / studentCount;
      return { exam_name: examName, date, studentCount, avgScore };
    });
  }, [studentData, exams]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <PageHeader title="Denemeler" description="Sistemde kayıtlı tüm deneme sınavları." />
        <Button>Yeni Deneme Ekle</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deneme Adı</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-center">Katılım (Öğrenci)</TableHead>
                  <TableHead className="text-right">Ortalama Puan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}><Skeleton className="h-6" /></TableCell>
                    </TableRow>
                  ))
                ) : examStats.length > 0 ? (
                  examStats.map((exam) => (
                    <TableRow key={exam.exam_name}>
                      <TableCell className="font-medium">{exam.exam_name}</TableCell>
                      <TableCell>{new Date(exam.date).toLocaleDateString('tr-TR')}</TableCell>
                      <TableCell className="text-center">{exam.studentCount}</TableCell>
                      <TableCell className="text-right">{exam.avgScore.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Hiç deneme bulunamadı. Lütfen "Yükleme" sayfasından veri yükleyin.
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
