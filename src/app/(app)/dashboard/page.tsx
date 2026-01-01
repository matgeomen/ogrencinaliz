"use client";

import { useData } from '@/contexts/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Target, CheckCircle, Award } from 'lucide-react';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#4CAF50', '#FFC107', '#F44336', '#2196F3'];

export default function DashboardPage() {
  const { studentData, selectedExam, loading } = useData();

  const examData = useMemo(() => {
    return studentData.filter(d => d.exam_name === selectedExam);
  }, [studentData, selectedExam]);

  const stats = useMemo(() => {
    if (examData.length === 0) {
      return { studentCount: 0, avgNet: 0, avgScore: 0, successRate: 0 };
    }
    const totalStudents = examData.length;
    const totalNet = examData.reduce((sum, d) => sum + d.toplam_net, 0);
    const totalScore = examData.reduce((sum, d) => sum + d.toplam_puan, 0);
    const avgNet = totalNet / totalStudents;
    const avgScore = totalScore / totalStudents;
    const successRate = (avgScore / 500) * 100; // Assuming max score is 500

    return {
      studentCount: totalStudents,
      avgNet: avgNet.toFixed(2),
      avgScore: avgScore.toFixed(2),
      successRate: successRate.toFixed(2),
    };
  }, [examData]);

  const lessonAverages = useMemo(() => {
     if (examData.length === 0) return [];
     const total = examData.length;
     const lessons = ['turkce', 'tarih', 'din', 'ing', 'mat', 'fen'];
     const lessonNames = ['Türkçe', 'Tarih', 'Din', 'İngilizce', 'Matematik', 'Fen'];

     return lessons.map((lesson, index) => ({
        name: lessonNames[index],
        'Ortalama Net': (examData.reduce((acc, s) => acc + s[`${lesson}_net`], 0) / total).toFixed(2),
     }));
  }, [examData]);

  const scoreDistribution = useMemo(() => {
    if (examData.length === 0) return [];
    const ranges = [
      { name: '400-500 Puan', min: 400, max: 500, count: 0 },
      { name: '300-399 Puan', min: 300, max: 399.99, count: 0 },
      { name: '200-299 Puan', min: 200, max: 299.99, count: 0 },
      { name: '< 200 Puan', min: 0, max: 199.99, count: 0 },
    ];
    examData.forEach(student => {
      const range = ranges.find(r => student.toplam_puan >= r.min && student.toplam_puan <= r.max);
      if (range) range.count++;
    });
    return ranges.filter(r => r.count > 0).map(r => ({ name: r.name, value: r.count }));
  }, [examData]);
  
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ana Sayfa" description="Sisteme genel bakış." />
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
      <PageHeader title="Ana Sayfa" description={`"${selectedExam}" denemesi için genel bakış.`} />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Öğrenci</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentCount}</div>
            <p className="text-xs text-muted-foreground">Sınava katılan öğrenci sayısı</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Net</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgNet}</div>
            <p className="text-xs text-muted-foreground">90 soru üzerinden</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Puan</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore}</div>
            <p className="text-xs text-muted-foreground">500 tam puan üzerinden</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genel Başarı</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{stats.successRate}</div>
            <p className="text-xs text-muted-foreground">Puan bazlı başarı oranı</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Derslere Göre Ortalama Netler</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lessonAverages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Ortalama Net" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Puan Aralığı Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={300}>
               <PieChart>
                 <Pie
                   data={scoreDistribution}
                   cx="50%"
                   cy="50%"
                   labelLine={false}
                   label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                   outerRadius={80}
                   fill="#8884d8"
                   dataKey="value"
                 >
                   {scoreDistribution.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
