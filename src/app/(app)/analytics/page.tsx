"use client";

import { useMemo, useState } from 'react';
import { useData } from '@/contexts/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generateAiAssessmentReport } from '@/ai/flows/generate-ai-assessment-report';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const PIE_COLORS = ['#16a34a', '#f97316', '#ef4444', '#3b82f6'];

export default function AnalyticsPage() {
  const { studentData, selectedExam, classes, loading } = useData();
  const [selectedClass, setSelectedClass] = useState('all');
  const [aiReport, setAiReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

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
      A: parseFloat(((filteredData.reduce((acc, s) => acc + s[lesson.key], 0) / total)).toFixed(2)),
      fullMark: lesson.max,
    }));
  }, [filteredData]);

  const pieData = useMemo(() => {
     if (filteredData.length === 0) return [];
    const ranges = [
      { name: 'Başarılı (75% - 100%)', min: 0.75, max: 1.01, count: 0 },
      { name: 'Orta (50% - 74%)', min: 0.50, max: 0.75, count: 0 },
      { name: 'Gelişmeli (0% - 49%)', min: 0, max: 0.50, count: 0 },
    ];
    filteredData.forEach(student => {
      const successRatio = student.toplam_net / 90;
      const range = ranges.find(r => successRatio >= r.min && successRatio < r.max);
      if (range) range.count++;
    });
    return ranges.filter(r => r.count > 0).map(r => ({ name: r.name, value: r.count }));
  }, [filteredData]);

  const handleGenerateReport = async () => {
    if (filteredData.length === 0) {
      toast({
        variant: "destructive",
        title: "Rapor Oluşturulamadı",
        description: "Analiz için yeterli veri bulunamadı.",
      });
      return;
    }
    setIsGenerating(true);
    setAiReport('');
    try {
      const result = await generateAiAssessmentReport({
        classData: JSON.stringify(filteredData),
        examName: selectedExam
      });
      setAiReport(result.report);
    } catch (error) {
      console.error("AI report generation failed:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Yapay zeka raporu oluşturulurken bir hata oluştu.",
      });
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="space-y-6">
      <PageHeader title="Analizler" description="Sınıf ve ders bazında performans analizleri." />

      <div className="flex items-center space-x-4">
        <label htmlFor="class-filter" className="font-medium">Sınıf Filtresi:</label>
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
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ders Bazlı Başarı</CardTitle>
              <CardDescription>Seçili grup için derslerin ortalama net başarısı.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 20]} />
                  <Radar name="Ortalama Net" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Başarı Dağılımı</CardTitle>
               <CardDescription>Öğrencilerin toplam nete göre başarı dilimleri.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Yapay Zeka Destekli Analiz Raporu</CardTitle>
          <CardDescription>Seçili deneme ve sınıf için yapay zeka tarafından oluşturulan detaylı analiz raporu.</CardDescription>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
             <div className="flex items-center justify-center h-48">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                <p className="text-muted-foreground">Rapor oluşturuluyor...</p>
             </div>
          ) : aiReport ? (
            <Textarea readOnly value={aiReport} className="h-48 whitespace-pre-wrap" />
          ) : (
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Rapor oluşturmak için butona tıklayın.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateReport} disabled={isGenerating || loading}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rapor Oluştur
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
