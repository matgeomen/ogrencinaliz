"use client";

import { useData } from '@/contexts/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Target, CheckCircle, Award, FileText } from 'lucide-react';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const LESSON_COLORS = {
  'Türkçe': '#5B57D2',
  'Tarih': '#34B58A',
  'Din': '#F5A623',
  'İngilizce': '#D0021B',
  'Matematik': '#4A90E2',
  'Fen': '#7ED321',
};


export default function DashboardPage() {
  const { studentData, selectedExam, exams, loading } = useData();

  const examData = useMemo(() => {
    return studentData.filter(d => d.exam_name === selectedExam);
  }, [studentData, selectedExam]);

  const stats = useMemo(() => {
    if (examData.length === 0) {
      return { studentCount: 0, examCount: exams.length, avgNet: 0, successRate: 0 };
    }
    const totalStudents = examData.length;
    const totalNet = examData.reduce((sum, d) => sum + d.toplam_net, 0);
    const totalScore = examData.reduce((sum, d) => sum + d.toplam_puan, 0);
    const avgNet = totalNet / totalStudents;
    const avgScore = totalScore / totalStudents;
    const successRate = (avgScore / 500) * 100; // Assuming max score is 500

    return {
      studentCount: totalStudents,
      examCount: exams.length,
      avgNet: avgNet.toFixed(2),
      successRate: successRate.toFixed(2),
    };
  }, [examData, exams.length]);

  const lessonAverages = useMemo(() => {
     if (examData.length === 0) return [];
     const total = examData.length;
     const lessons = ['turkce', 'tarih', 'din', 'ing', 'mat', 'fen'];
     const lessonNames = ['Türkçe', 'Tarih', 'Din', 'İngilizce', 'Matematik', 'Fen'];

     return lessons.map((lesson, index) => ({
        name: lessonNames[index],
        'Ortalama Net': parseFloat((examData.reduce((acc, s) => acc + (s as any)[`${lesson}_net`], 0) / total).toFixed(2)),
     }));
  }, [examData]);

  const scoreDistribution = useMemo(() => {
    if (examData.length === 0) return [];
    const ranges = [
      { name: '400-500', min: 400, max: 500.01, count: 0, color: '#5B57D2' },
      { name: '300-400', min: 300, max: 400, count: 0, color: '#34B58A' },
      { name: '200-300', min: 200, max: 300, count: 0, color: '#F5A623' },
      { name: '100-200', min: 100, max: 200, count: 0, color: '#F8E71C' },
      { name: '0-100', min: 0, max: 100, count: 0, color: '#D0021B' },
    ];
    examData.forEach(student => {
      const range = ranges.find(r => student.toplam_puan >= r.min && student.toplam_puan < r.max);
      if (range) range.count++;
    });
    return ranges.filter(r => r.count > 0).map(r => ({ name: r.name, value: r.count, color: r.color }));
  }, [examData]);
  
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Kontrol Merkezi" description="Sisteme genel bakış." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Kontrol Merkezi" description={`"${selectedExam}" sonuçları`} />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Öğrenci</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Deneme</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.examCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Net</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgNet}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarı Oranı</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{stats.successRate}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ders Bazlı Performans</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lessonAverages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Ortalama Net">
                  {lessonAverages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={LESSON_COLORS[entry.name as keyof typeof LESSON_COLORS] || '#8884d8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Puan Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={300}>
               <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                   {scoreDistribution.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
