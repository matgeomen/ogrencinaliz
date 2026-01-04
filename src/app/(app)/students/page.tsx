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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StudentExamResult } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

function StudentDetailModal({ student }: { student: StudentExamResult }) {
  const { studentData } = useData();

  const studentAllResults = useMemo(() => {
    return studentData
      .filter(d => d.student_no === student.student_no)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [studentData, student.student_no]);

  const selectedExamResult = studentAllResults.find(r => r.exam_name === student.exam_name);

  const lessonData = selectedExamResult ? [
    { name: 'Türkçe', net: selectedExamResult.turkce_net },
    { name: 'Matematik', net: selectedExamResult.mat_net },
    { name: 'Fen Bilimleri', net: selectedExamResult.fen_net },
    { name: 'T.C. İnkılap Tarihi', net: selectedExamResult.tarih_net },
    { name: 'Din Kültürü', net: selectedExamResult.din_net },
    { name: 'İngilizce', net: selectedExamResult.ing_net },
  ] : [];

  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <div className="flex items-center gap-4">
          <div className="bg-muted rounded-full p-2">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <DialogTitle className="text-2xl">{student.student_name}</DialogTitle>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 text-center">
            <div>
                <p className="text-sm text-muted-foreground">Öğrenci No</p>
                <p className="font-semibold">{student.student_no}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Sınıf</p>
                <p className="font-semibold">{student.class}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Toplam Puan</p>
                <p className="font-semibold text-primary">{student.toplam_puan.toFixed(2)}</p>
            </div>
        </div>
      </DialogHeader>
      <div className="py-4 space-y-8">
        <div>
            <h3 className="font-semibold mb-4">Ders Bazlı Net Dağılımı ({student.exam_name})</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={lessonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="net" fill="hsl(var(--primary))" name="Net Sayısı" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        </div>
        <div>
            <h3 className="font-semibold mb-4">Deneme Geçmişi</h3>
            <div className="space-y-4">
                {studentAllResults.map(result => (
                    <div key={result.exam_name}>
                        <div className="flex justify-between items-center">
                            <p className="font-medium">{result.exam_name}</p>
                            <div className="text-right">
                                <p className="text-sm"><span className="text-muted-foreground">Net:</span> {result.toplam_net.toFixed(2)}</p>
                                <p className="text-sm font-semibold"><span className="text-muted-foreground">Puan:</span> {result.toplam_puan.toFixed(2)}</p>
                            </div>
                        </div>
                        <Separator className="mt-2" />
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


export default function StudentsPage() {
  const { studentData, selectedExam, classes, loading } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  const filteredData = useMemo(() => {
    return studentData
      .filter(d => d.exam_name === selectedExam)
      .filter(d => classFilter === 'all' || d.class === classFilter)
      .filter(d => 
        d.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.student_no.toString().includes(searchTerm)
      );
  }, [studentData, selectedExam, classFilter, searchTerm]);

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
                  <TableHead>No</TableHead>
                  <TableHead>Adı Soyadı</TableHead>
                  <TableHead>Sınıf</TableHead>
                  <TableHead className="text-right">Toplam Net</TableHead>
                  <TableHead className="text-right">Toplam Puan</TableHead>
                  <TableHead className="text-center">Durum</TableHead>
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
                          <TableCell>{student.class}</TableCell>
                          <TableCell className="text-right">{student.toplam_net.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{student.toplam_puan.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={status.variant} className={cn(
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
