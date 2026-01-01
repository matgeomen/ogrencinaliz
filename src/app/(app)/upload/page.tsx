"use client";

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/data-context';
import * as XLSX from 'xlsx';
import { StudentExamResult } from '@/types';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { analyzeEokulData } from '@/ai/flows/analyze-eokul-data';
import { Textarea } from '@/components/ui/textarea';

// Dynamically import pdfjs-dist to avoid SSR issues
const pdfjsPromise = import('pdfjs-dist');


export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfAnalysis, setPdfAnalysis] = useState('');
  const { toast } = useToast();
  const { addStudentData } = useData();

  useEffect(() => {
    pdfjsPromise.then(pdfjs => {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    });
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/pdf': ['.pdf'],
    }
  });

  const removeFile = (file: File) => {
    setFiles(prev => prev.filter(f => f !== file));
    if (file.type.includes('pdf')) {
      setPdfAnalysis('');
    }
  };

  const processFiles = async () => {
    if (files.length === 0) {
      toast({ title: 'Lütfen dosya seçin.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    setPdfAnalysis('');

    for (const file of files) {
      if (file.name.endsWith('.xlsx')) {
        await processExcel(file);
      } else if (file.name.endsWith('.pdf')) {
        await processPdf(file);
      }
    }

    setIsProcessing(false);
    setFiles([]); // Clear files after processing
  };

  const processExcel = (file: File) => {
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: 0 }) as any[];

          const requiredCols = ['exam_name', 'student_no', 'student_name'];
          const firstRow = json[0];
          if (!firstRow || !requiredCols.every(col => col in firstRow)) {
              throw new Error("Excel dosyasında gerekli sütunlar (exam_name, student_no, student_name) bulunamadı.");
          }
          
          const formattedData: StudentExamResult[] = json.map(row => ({
            exam_name: row.exam_name, date: row.date || new Date().toISOString().split('T')[0], class: row.class || 'N/A', student_no: Number(row.student_no), student_name: row.student_name,
            toplam_dogru: Number(row.toplam_dogru), toplam_yanlis: Number(row.toplam_yanlis), toplam_net: Number(row.toplam_net), toplam_puan: Number(row.toplam_puan),
            turkce_d: Number(row.turkce_d), turkce_y: Number(row.turkce_y), turkce_net: Number(row.turkce_net),
            tarih_d: Number(row.tarih_d), tarih_y: Number(row.tarih_y), tarih_net: Number(row.tarih_net),
            din_d: Number(row.din_d), din_y: Number(row.din_y), din_net: Number(row.din_net),
            ing_d: Number(row.ing_d), ing_y: Number(row.ing_y), ing_net: Number(row.ing_net),
            mat_d: Number(row.mat_d), mat_y: Number(row.mat_y), mat_net: Number(row.mat_net),
            fen_d: Number(row.fen_d), fen_y: Number(row.fen_y), fen_net: Number(row.fen_net),
          }));
          
          addStudentData(formattedData);
          toast({ title: `${file.name} başarıyla işlendi.`, description: `${formattedData.length} kayıt eklendi.` });

        } catch (error: any) {
          toast({ title: `Hata: ${file.name}`, description: error.message || 'Excel dosyası işlenemedi.', variant: 'destructive' });
        }
        resolve();
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const processPdf = async (file: File) => {
      try {
        const pdfjs = await pdfjsPromise;
        const pdf = await pdfjs.getDocument(URL.createObjectURL(file)).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ');
        }
        
        toast({ title: 'PDF Okundu', description: 'Metin içeriği AI analizi için gönderiliyor...' });

        const result = await analyzeEokulData({
            eokulData: textContent,
            examName: file.name,
            studentName: 'Bilinmeyen Öğrenci',
            className: 'Bilinmeyen Sınıf'
        });
        setPdfAnalysis(result.analysis);
        toast({ title: 'PDF Analizi Tamamlandı', description: 'Yapay zeka analizi aşağıda gösterilmektedir.' });

      } catch (error) {
        toast({ title: `Hata: ${file.name}`, description: 'PDF dosyası okunamadı veya analiz edilemedi.', variant: 'destructive' });
        console.error(error);
      }
  };


  return (
    <div className="space-y-6">
      <PageHeader title="Veri Yükleme" description="Deneme sonuçlarını Excel (.xlsx) veya PDF (.pdf) formatında yükleyin." />

      <Card>
        <CardHeader>
          <CardTitle>Dosya Yükleme Alanı</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div {...getRootProps()} className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors">
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            {isDragActive ?
              <p className="mt-4 text-muted-foreground">Dosyaları buraya bırakın...</p> :
              <p className="mt-4 text-muted-foreground">Dosyaları buraya sürükleyin veya seçmek için tıklayın</p>
            }
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Seçilen Dosyalar:</h3>
              <ul className="space-y-2">
                {files.map(file => (
                  <li key={file.name} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                    <div className="flex items-center gap-2">
                      <File className="h-5 w-5" />
                      <span>{file.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(file)} className="h-6 w-6">
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button onClick={processFiles} disabled={isProcessing || files.length === 0}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            İşle ve Kaydet
          </Button>
        </CardContent>
      </Card>
      {pdfAnalysis && (
        <Card>
            <CardHeader>
                <CardTitle>PDF Analiz Sonucu</CardTitle>
                <CardDescription>Yüklenen PDF dosyasının yapay zeka tarafından yapılan analizi.</CardDescription>
            </Header>
            <CardContent>
                <Textarea value={pdfAnalysis} readOnly className="h-64 whitespace-pre-wrap" />
            </CardContent>
        </Card>
      )}
    </div>
  );
}
