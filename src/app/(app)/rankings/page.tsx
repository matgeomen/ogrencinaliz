"use client";

import { useMemo, useState } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SortKey = keyof typeof sortableColumns;

const sortableColumns = {
  rank: 'Sıra',
  student_no: 'No',
  student_name: 'Ad Soyad',
  class: 'Sınıf',
  toplam_puan: 'Toplam Puan',
  toplam_net: 'Toplam Net',
  turkce_net: 'Türkçe',
  mat_net: 'Matematik',
  fen_net: 'Fen',
  tarih_net: 'Tarih',
  din_net: 'Din Kültürü',
  ing_net: 'İngilizce',
};

export default function RankingsPage() {
  const { studentData, selectedExam, loading } = useData();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'toplam_puan', direction: 'descending' });

  const sortedData = useMemo(() => {
    const examData = studentData.filter(d => d.exam_name === selectedExam);
    if (examData.length === 0) return [];

    const sorted = [...examData].sort((a, b) => {
      const aValue = a[sortConfig.key] || 0;
      const bValue = b[sortConfig.key] || 0;

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return sorted.map((item, index) => ({ ...item, rank: index + 1 }));
  }, [studentData, selectedExam, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const renderSortableHeader = (key: SortKey) => (
    <Button variant="ghost" onClick={() => requestSort(key)} className="px-2">
      {sortableColumns[key]}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Sıralamalar" description={`"${selectedExam}" denemesi için öğrenci sıralamaları.`} />

      <Card>
        <CardContent className="pt-6">
          <div className="relative w-full overflow-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-20 min-w-[80px]">{renderSortableHeader('rank')}</TableHead>
                  <TableHead className="sticky left-[80px] bg-background z-20 min-w-[150px]">{renderSortableHeader('student_name')}</TableHead>
                  <TableHead>{renderSortableHeader('class')}</TableHead>
                  <TableHead className="text-right">{renderSortableHeader('toplam_puan')}</TableHead>
                  <TableHead className="text-right">{renderSortableHeader('toplam_net')}</TableHead>
                  <TableHead className="text-right">{renderSortableHeader('turkce_net')}</TableHead>
                  <TableHead className="text-right">{renderSortableHeader('mat_net')}</TableHead>
                  <TableHead className="text-right">{renderSortableHeader('fen_net')}</TableHead>
                  <TableHead className="text-right">{renderSortableHeader('tarih_net')}</TableHead>
                  <TableHead className="text-right">{renderSortableHeader('din_net')}</TableHead>
                  <TableHead className="text-right">{renderSortableHeader('ing_net')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(10)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={11}><Skeleton className="h-6" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedData.length > 0 ? (
                  sortedData.map((student) => (
                    <TableRow key={student.student_no}>
                      <TableCell className="sticky left-0 bg-card z-10 font-medium">{student.rank}</TableCell>
                      <TableCell className="sticky left-[80px] bg-card z-10 font-medium">{student.student_name}</TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell className="text-right font-semibold">{student.toplam_puan.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{student.toplam_net.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{student.turkce_net.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{student.mat_net.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{student.fen_net.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{student.tarih_net.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{student.din_net.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{student.ing_net.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      Sıralama için veri bulunamadı.
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
