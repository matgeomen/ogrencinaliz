"use client";

import { useState, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StudentExamResult } from '@/types';

function StudentDetailModal({ student }: { student: StudentExamResult }) {
  const lessonData = [
    { name: 'Türkçe', net: student.turkce_net },
    { name: 'Tarih', net: student.tarih_net },
    { name: 'Din', net: student.din_net },
    { name: 'İngilizce', net: student.ing_net },
    { name: 'Matematik', net: student.mat_net },
    { name: 'Fen', net: student.fen_net },
  ];
  return (
    <DialogContent className="sm:max-w-[625px]">
      <DialogHeader>
        <DialogTitle>{student.student_name} - Ders Bazlı Netler</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={lessonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="net" fill="hsl(var(--primary))" name="Net Sayısı" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DialogContent>
  );
}

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
      <PageHeader title="Öğrenciler" description="Öğrenci deneme sonuçlarını görüntüleyin ve filtreleyin." />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input 
              placeholder="Öğrenci adı veya numara ara..." 
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
                  <TableHead>Öğrenci No</TableHead>
                  <TableHead>Adı Soyadı</TableHead>
                  <TableHead>Sınıf</TableHead>
                  <TableHead className="text-right">Toplam Puan</TableHead>
                  <TableHead className="text-right">Toplam Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}><Skeleton className="h-6" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredData.length > 0 ? (
                  filteredData.map((student) => (
                    <Dialog key={student.student_no}>
                      <DialogTrigger asChild>
                        <TableRow className="cursor-pointer">
                          <TableCell>{student.student_no}</TableCell>
                          <TableCell className="font-medium">{student.student_name}</TableCell>
                          <TableCell>{student.class}</TableCell>
                          <TableCell className="text-right">{student.toplam_puan.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{student.toplam_net.toFixed(2)}</TableCell>
                        </TableRow>
                      </DialogTrigger>
                      <StudentDetailModal student={student} />
                    </Dialog>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
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
