"use client";

import { useMemo, useState } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentExamResult } from '@/types';

type SortKey = keyof StudentExamResult | 'rank';

const sortableColumns: { key: SortKey, label: string }[] = [
  { key: 'rank', label: 'Sıra' },
  { key: 'student_name', label: 'Öğrenci' },
  { key: 'class', label: 'Sınıf' },
  { key: 'toplam_net', label: 'Toplam Net' },
  { key: 'toplam_puan', label: 'Toplam Puan' },
  { key: 'turkce_net', label: 'Türkçe' },
  { key: 'mat_net', label: 'Matematik' },
  { key: 'fen_net', label: 'Fen Bilimleri' },
  { key: 'tarih_net', label: 'T.C. İnkılap Tarihi' },
  { key: 'din_net', label: 'Din Kültürü' },
  { key: 'ing_net', label: 'İngilizce' },
];

export default function RankingsPage() {
  const { studentData, selectedExam, loading } = useData();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'toplam_puan', direction: 'descending' });

  const sortedData = useMemo(() => {
    const examData = studentData.filter(d => d.exam_name === selectedExam);
    if (examData.length === 0) return [];

    let sortableItems = [...examData];

    if (sortConfig.key !== 'rank' && sortConfig.key !== 'student_name' && sortConfig.key !== 'class') {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof StudentExamResult] as number || 0;
        const bValue = b[sortConfig.key as keyof StudentExamResult] as number || 0;

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return a.student_name.localeCompare(b.student_name);
      });
    }
    
    let rankedData = sortableItems.map((item, index) => ({ ...item, rank: index + 1 }));

    if (sortConfig.key === 'rank' || sortConfig.key === 'class' || sortConfig.key === 'student_name') {
        rankedData.sort((a,b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            let comparison = 0;
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                if (aValue < bValue) comparison = -1;
                if (aValue > bValue) comparison = 1;
            }

            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }
    
    return rankedData;

  }, [studentData, selectedExam, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const renderSortableHeader = (column: { key: SortKey, label: string }) => (
    <TableHead 
        key={column.key}
        className={column.key.toString().includes('net') || column.key.toString().includes('puan') ? "text-right" : ""}
    >
        <Button variant="ghost" onClick={() => requestSort(column.key)} className="px-2 whitespace-nowrap">
            {column.label}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    </TableHead>
  );

  return (
    <div className="space-y-6 w-full" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <PageHeader title="Sıralamalar" description={selectedExam ? `"${selectedExam}" denemesi sıralaması` : "Genel sıralamalar"} />

      <Card className="w-full" style={{ maxWidth: '100%' }}>
        <CardContent className="pt-6 w-full overflow-hidden">
          <div className="w-full overflow-x-auto -mx-6 px-6" style={{ maxWidth: 'calc(100vw - 300px)' }}>
            <div className="rounded-md border inline-block min-w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                      {sortableColumns.map(col => renderSortableHeader(col))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                  [...Array(10)].map((_, i) => (
                      <TableRow key={i}>
                      <TableCell colSpan={sortableColumns.length}><Skeleton className="h-8" /></TableCell>
                      </TableRow>
                  ))
                  ) : sortedData.length > 0 ? (
                  sortedData.map((student) => (
                      <TableRow key={student.student_no}>
                          <TableCell className="whitespace-nowrap">
                              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">{student.rank}</div>
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px]">
                              <div className="truncate" title={student.student_name}>{student.student_name}</div>
                              <div className="text-xs text-muted-foreground">{student.student_no}</div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{student.class}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{student.toplam_net.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-semibold text-primary whitespace-nowrap">{student.toplam_puan.toFixed(2)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{student.turkce_net.toFixed(2)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{student.mat_net.toFixed(2)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{student.fen_net.toFixed(2)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{student.tarih_net.toFixed(2)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{student.din_net.toFixed(2)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{student.ing_net.toFixed(2)}</TableCell>
                      </TableRow>
                  ))
                  ) : (
                  <TableRow>
                      <TableCell colSpan={sortableColumns.length} className="h-24 text-center">
                      Sıralama için veri bulunamadı. Lütfen bir deneme seçin.
                      </TableCell>
                  </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}