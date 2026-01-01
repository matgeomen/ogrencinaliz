"use client";

import { useMemo, useState } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PIE_COLORS = {
  '400-500': '#3b82f6',
  '300-400': '#16a34a',
  '200-300': '#f97316',
  '100-200': '#ef4444',
  '0-100': '#dc2626',
};


export default function AnalyticsPage() {
  const { studentData, selectedExam, classes, loading } = useData();
  const [selectedClass, setSelectedClass] = useState('all');

  const filteredData = useMemo(() => {
    return studentData.filter(d => 
      d.exam_name === selectedExam && 
      (selectedClass === 'all' || d.class === selectedClass)
    );
  }, [studentData, selectedExam, selectedClass]);
  
  const radarData = useMemo(() => {
    if (filteredData.length === 0) return [];
    const total = filteredData.length;
    const lessons = [
      { subject: 'Türkçe', key: 'turkce_net', max: 20 },
      { subject: 'Matematik', key: 'mat_net', max: 20 },
      { subject: 'Fen', key: 'fen_net', max: 20 },
      { subject: 'Tarih', key: 'tarih_net', max: 10 },
      { subject: 'Din', key: 'din_net', max: 10 },
      { subject: 'İngilizce', key: 'ing_net', max: 10 },
    ];

    return lessons.map(lesson => ({
      subject: lesson.subject,
      A: parseFloat(((filteredData.reduce((acc, s) => acc + s[lesson.key as keyof typeof s], 0) / total)).toFixed(2)),
      fullMark: lesson.max,
    }));
  }, [filteredData]);

  const pieData = useMemo(() => {
    if (filteredData.length === 0) return [];
    const ranges = [
      { name: '400-500', min: 400, max: 500.01, count: 0 },
      { name: '300-400', min: 300, max: 400, count: 0 },
      { name: '200-300', min: 200, max: 300, count: 0 },
      { name: '100-200', min: 100, max: 200, count: 0 },
      { name: '0-100', min: 0, max: 100, count: 0 },
    ];
    filteredData.forEach(student => {
      const range = ranges.find(r => student.toplam_puan >= r.min && student.toplam_puan < r.max);
      if (range) range.count++;
    });
    return ranges.filter(r => r.count > 0).map(r => ({ name: r.name, value: r.count }));
  }, [filteredData]);


  return (
    <div className="space-y-6">
      <PageHeader title="Analizler" description={`${selectedExam} analizi`} />

      <div className="flex items-center space-x-4">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger id="class-filter" className="w-[180px]">
            <SelectValue placeholder="Sınıf Seç" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Sınıflar</SelectItem>
            {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <Skeleton className="w-full h-96" /> : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ders Bazlı Başarı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 20]} />
                    <Radar name="Ortalama Net" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)"}}/>
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Başarı Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {pieData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)"}}/>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
           <Card>
            <CardHeader>
              <CardTitle>Ders Ortalamaları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {radarData.map((lesson) => (
                  <Card key={lesson.subject} className="flex flex-col items-center justify-center p-4">
                    <p className="text-sm text-muted-foreground">{lesson.subject}</p>
                    <p className="text-2xl font-bold text-primary">{lesson.A}</p>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
