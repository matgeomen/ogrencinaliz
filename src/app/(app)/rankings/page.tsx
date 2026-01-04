
"use client";

import { useMemo, useState } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DersAnalizi, StudentExamResult } from '@/types';

type SortKey = keyof StudentExamResult | 'rank' | 'turkce_net' | 'mat_net' | 'fen_net' | 'tarih_net' | 'din_net' | 'ing_net';

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

  const getDersNet = (ders: DersAnalizi) => ders?.net || 0;

  const sortedData = useMemo(() => {
    const examData = studentData.filter(d => d.exam_name === selectedExam);
    if (examData.length === 0) return [];

    let sortableItems = [...examData];
    
    sortableItems.sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.key.endsWith('_net')) {
            const dersKey = sortConfig.key.replace('_net', '') as keyof Pick<StudentExamResult, 'turkce' | 'mat' | 'fen' | 'tarih' | 'din' | 'ing'>;
            aValue = a[dersKey]?.net ?? 0;
            bValue = b[dersKey]?.net ?? 0;
        } else if (['student_name', 'class'].includes(sortConfig.key)) {
             aValue = a[sortConfig.key as keyof StudentExamResult] as string;
             bValue = b[sortConfig.key as keyof StudentExamResult] as string;
             return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        } else {
            aValue = a[sortConfig.key as keyof StudentExamResult] as number || 0;
            bValue = b[sortConfig.key as keyof StudentExamResult] as number || 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        
        // Secondary sort by name
        return a.student_name.localeCompare(b.student_name);
    });
    
    // Add rank after primary sorting
    let rankedData = sortableItems.map((item, index) => ({ ...item, rank: index + 1 }));

    // If sorting by rank itself, just sort by the rank number
    if (sortConfig.key === 'rank') {
        rankedData.sort((a,b) => {
             return sortConfig.direction === 'ascending' ? a.rank - b.rank : b.rank - a.rank;
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
    <div className="space-y-6 w-full">
      <PageHeader title="Sıralamalar" description={selectedExam ? `"${selectedExam}" denemesi sıralaması` : "Genel sıralamalar"} />

      <Card className="w-full">
        <CardContent className="pt-6">
            <div className="rounded-md border overflow-x-auto">
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
                      <TableRow key={student.id}>
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
                          <TableCell className="text-right whitespace-nowrap">{getDersNet(student.turkce).toFixed(2)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{getDersNet(student.mat).toFixed(2)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{getDersNet(student.fen).toFixed(2)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{getDersNet(student.tarih).toFixed(2)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{getDersNet(student.din).toFixed(2)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{getDersNet(student.ing).toFixed(2)}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
