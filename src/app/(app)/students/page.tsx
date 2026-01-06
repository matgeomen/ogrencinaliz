"use client";

import { useState, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { StudentExamResult } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { User, ArrowUpDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const LESSON_COLORS = {
  'Türkçe': '#8884d8',
  'Matematik': '#82ca9d',
  'Fen Bilimleri': '#ffc658',
  'T.C. İnkılap Tarihi': '#ff8042',
  'Din Kültürü': '#00C49F',
  'İngilizce': '#FFBB28',
};


function StudentDetailModal({ student }: { student: StudentExamResult }) {
  const { studentData } = useData();

  const studentAllResults = useMemo(() => {
    return studentData
      .filter(d => d.student_no === student.student_no)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [studentData, student.student_no]);

  const selectedExamResult = studentAllResults.find(r => r.exam_name === student.exam_name);

  const lessonData = selectedExamResult ? [
    { name: 'Türkçe', net: selectedExamResult.turkce?.net ?? 0, color: LESSON_COLORS['Türkçe'] },
    { name: 'Matematik', net: selectedExamResult.mat?.net ?? 0, color: LESSON_COLORS['Matematik'] },
    { name: 'Fen Bilimleri', net: selectedExamResult.fen?.net ?? 0, color: LESSON_COLORS['Fen Bilimleri'] },
    { name: 'T.C. İnkılap Tarihi', net: selectedExamResult.tarih?.net ?? 0, color: LESSON_COLORS['T.C. İnkılap Tarihi'] },
    { name: 'Din Kültürü', net: selectedExamResult.din?.net ?? 0, color: LESSON_COLORS['Din Kültürü'] },
    { name: 'İngilizce', net: selectedExamResult.ing?.net ?? 0, color: LESSON_COLORS['İngilizce'] },
  ] : [];

  return (
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 text-primary rounded-full p-3">
            <User className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight">{student.student_name}</DialogTitle>
        </div>
      </DialogHeader>
      <div className="py-4 space-y-6">
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <Card>
                <CardHeader className="p-4">
                    <p className="text-sm text-muted-foreground">Öğrenci No</p>
                    <p className="text-2xl font-bold">{student.student_no}</p>
                </CardHeader>
            </Card>
            <Card>
                 <CardHeader className="p-4">
                    <p className="text-sm text-muted-foreground">Sınıf</p>
                    <p className="text-2xl font-bold">{student.class}</p>
                </CardHeader>
            </Card>
            <Card>
                 <CardHeader className="p-4">
                    <p className="text-sm text-muted-foreground">Toplam Puan</p>
                    <p className="text-2xl font-bold text-primary">{student.toplam_puan.toFixed(2)}</p>
                </CardHeader>
            </Card>
        </div>

        <Separator />
        
        <div>
            <h3 className="font-semibold mb-4 text-lg text-center">Ders Bazlı Net Dağılımı ({student.exam_name})</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={lessonData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{dy: 10}}/>
                <YAxis />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)"}}/>
                <Bar dataKey="net" name="Net Sayısı" radius={[4, 4, 0, 0]}>
                    {lessonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </div>
        
        <Separator />

        <div>
            <h3 className="font-semibold mb-4 text-lg text-center">Deneme Geçmişi</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-4">
                {studentAllResults.map(result => (
                    <div key={result.id} className="p-4 rounded-lg bg-secondary/50">
                        <div className="flex justify-between items-center">
                            <p className="font-medium">{result.exam_name}</p>
                            <div className="text-right">
                                <p className="text-sm"><span className="text-muted-foreground">Net:</span> {result.toplam_net.toFixed(2)}</p>
                                <p className="text-sm font-semibold text-primary"><span className="text-muted-foreground font-normal">Puan:</span> {result.toplam_puan.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </DialogContent>
  );
}

const getStatus = (score: number): { label: string, variant: "default" | "secondary" | "destructive" | "outline" } => {
    if (score >= 400) return { label: 'Çok İyi', variant: 'default' };
    if (score >= 300) return { label: 'İyi', variant: 'secondary' };
    if (score >= 200) return { label: 'Orta', variant: 'outline' };
    return { label: 'Zayıf', variant: 'destructive' };
};

type SortKey = keyof StudentExamResult | 'student_no' | 'student_name' | 'class' | 'toplam_puan';

const sortableColumns: { key: SortKey, label: string }[] = [
  { key: 'student_no', label: 'No' },
  { key: 'student_name', label: 'Adı Soyadı' },
  { key: 'class', label: 'Sınıf' },
  { key: 'toplam_puan', label: 'Puan' },
];

export default function StudentsPage() {
  const { studentData, selectedExam, classes, loading } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'toplam_puan', direction: 'descending' });

  const filteredData = useMemo(() => {
    let data = studentData
      .filter(d => d.exam_name === selectedExam)
      .filter(d => classFilter === 'all' || d.class === classFilter)
      .filter(d => 
        d.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.student_no.toString().includes(searchTerm)
      );

    if (sortConfig.key) {
        data.sort((a, b) => {
            let aValue, bValue;
            
            if (sortConfig.key === 'student_name' || sortConfig.key === 'class') {
                 aValue = a[sortConfig.key] as string;
                 bValue = b[sortConfig.key] as string;
                 return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            } else {
                aValue = a[sortConfig.key as 'student_no' | 'toplam_puan'] as number;
                bValue = b[sortConfig.key as 'student_no' | 'toplam_puan'] as number;
                return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
            }
        });
    }

    return data;
  }, [studentData, selectedExam, classFilter, searchTerm, sortConfig]);

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
        className={cn(
            column.key === 'toplam_puan' && 'text-right',
            column.key === 'student_name' && 'w-full',
            column.key === 'student_no' && 'w-[80px]',
            column.key === 'class' && 'hidden md:table-cell'
        )}
    >
        <Button variant="ghost" onClick={() => requestSort(column.key)} className="px-2 whitespace-nowrap">
            {column.label}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Öğrenciler" description={`${filteredData.length} öğrenci listeleniyor`} />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input 
              placeholder="Öğrenci adı veya numarası..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sınıf Seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Sınıflar</SelectItem>
                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {sortableColumns.map(col => renderSortableHeader(col))}
                  <TableHead className="text-center hidden sm:table-cell">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-6" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredData.length > 0 ? (
                  filteredData.map((student) => {
                    const status = getStatus(student.toplam_puan);
                    return (
                    <Dialog key={student.id}>
                      <DialogTrigger asChild>
                        <TableRow className="cursor-pointer">
                          <TableCell>{student.student_no}</TableCell>
                          <TableCell className="font-medium">{student.student_name}</TableCell>
                          <TableCell className="hidden md:table-cell">{student.class}</TableCell>
                          <TableCell className="text-right font-semibold">{student.toplam_puan.toFixed(2)}</TableCell>
                          <TableCell className="text-center hidden sm:table-cell">
                            <Badge variant={status.variant} className={cn(
                                'text-xs',
                                status.label === 'Çok İyi' && 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
                                status.label === 'İyi' && 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
                                status.label === 'Orta' && 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
                                status.label === 'Zayıf' && 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                            )}>{status.label}</Badge>
                          </TableCell>
                        </TableRow>
                      </DialogTrigger>
                      <StudentDetailModal student={student} />
                    </Dialog>
                  )})
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Sonuç bulunamadı.
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
