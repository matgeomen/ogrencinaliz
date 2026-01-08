"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/data-context';
import * as XLSX from 'xlsx';
import { StudentExamResult } from '@/types';
import { UploadCloud, File as FileIcon, X, Loader2, Download, AlertCircle, FileSpreadsheet, FileText, CheckCircle, Info } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { processExamData } from '@/ai/flows/process-exam-data-flow';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

// Set worker source
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}


export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { addStudentData } = useData();
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles].filter((f, i, self) => self.findIndex(t => t.name === f.name) === i));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/pdf': ['.pdf'],
    }
  });

  const removeFile = (file: File) => {
    setFiles(prev => prev.filter(f => f.name !== file.name));
  };

  const processFiles = async () => {
    if (files.length === 0) {
      toast({ title: 'Lütfen dosya seçin.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    setStatusMessage('');
    setProgress(0);

    let successCount = 0;
    let errorCount = 0;

    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const currentProgress = ((i + 1) / totalFiles) * 100;
        
        try {
            setStatusMessage(`Dosya ${i + 1}/${totalFiles} okunuyor: ${file.name}`);
            let fileContent = '';
            if (file.name.endsWith('.xlsx')) {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                fileContent = JSON.stringify(json);
            } else if (file.name.endsWith('.pdf')) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const text = await page.getTextContent();
                    fileContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ');
                }
            } else {
                throw new Error('Desteklenmeyen dosya türü');
            }

            setStatusMessage(`Dosya AI tarafından işleniyor: ${file.name}`);
            
            // onProgress callback'i tanımlı olarak gönder
            const aiResult = await processExamData({
                fileName: file.name,
                fileContent: fileContent,
            }, (progressMessage: string) => {
                // Progress mesajlarını güvenli bir şekilde göster
                if (progressMessage) {
                    setStatusMessage(`${file.name}: ${progressMessage}`);
                }
            });

            if (aiResult && aiResult.results.length > 0) {
                addStudentData(aiResult.results);
                successCount++;
            } else {
                throw new Error("AI veriyi işleyemedi veya dosyada sonuç bulunamadı.");
            }

        } catch (error: any) {
            console.error("File Processing Error:", error);
            const errorMessage = error.message?.toLowerCase() || '';
            
            if (errorMessage.includes('api key') || errorMessage.includes('api anahtarı')) {
                toast({
                    title: "AI API Anahtarı Geçersiz veya Eksik",
                    description: (
                        <span>
                            Lütfen AI özelliklerini kullanmak için Ayarlar sayfasından API anahtarınızı girin ve kaydedin.
                            <Link href="/settings" className="underline font-semibold ml-1">Ayarlara Git</Link>
                        </span>
                    ),
                    variant: "destructive",
                    duration: 10000,
                });
            } else if (errorMessage.includes('quota') || errorMessage.includes('429')) {
                toast({ 
                    title: `API Limiti Aşıldı`, 
                    description: 'Gemini API kotanız dolmuş olabilir. Birkaç dakika bekleyip tekrar deneyin.', 
                    variant: 'destructive',
                    duration: 8000
                });
            } else {
                toast({ 
                    title: `Hata: ${file.name}`, 
                    description: error.message || 'Dosya işlenemedi.', 
                    variant: 'destructive' 
                });
            }
            errorCount++;
        }
        setProgress(currentProgress);
    }
    
    if (successCount > 0) {
      toast({ 
        title: "İşlem Tamamlandı", 
        description: `${successCount} dosya AI tarafından başarıyla işlendi ve veriler eklendi.`,
        duration: 5000
      });
    }
    if (errorCount > 0 && successCount === 0) {
       toast({ 
        title: "İşlem Başarısız", 
        description: `${errorCount} dosya işlenirken hata oluştu.`, 
        variant: 'destructive' 
      });
    }

    setIsProcessing(false);
    setFiles([]); // Clear files after processing
    setStatusMessage('');
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Veri Yükleme" description="AI Destekli Excel veya PDF dosyası yükleyin" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dosya Yükle</CardTitle>
          <Button variant="outline" asChild>
            <a href="/template.xlsx" download><Download className="mr-2 h-4 w-4" /> Excel Şablonu</a>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div {...getRootProps()} className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors bg-secondary/50">
            <input {...getInputProps()} />
            <div className="flex justify-center items-center gap-6">
                <FileSpreadsheet className="h-12 w-12 text-green-500" />
                <FileText className="h-12 w-12 text-red-500" />
            </div>
            {isDragActive ?
              <p className="mt-4 text-muted-foreground">Dosyaları buraya bırakın...</p> :
              <>
                <p className="mt-4 font-semibold text-foreground">Dosyayı sürükleyip bırakın</p>
                <p className="text-sm text-muted-foreground">veya tıklayarak seçin (AI Destekli Excel veya PDF)</p>
              </>
            }
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Sıraya Alınan Dosyalar:</h3>
              <ul className="space-y-2">
                {files.map(file => (
                  <li key={file.name} className="flex items-center justify-between p-2 pl-3 pr-2 bg-secondary rounded-md text-sm">
                    <div className="flex items-center gap-3">
                      {file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') ? 
                        <FileSpreadsheet className="h-5 w-5 text-green-600" /> : 
                        <FileText className="h-5 w-5 text-red-600" />
                      }
                      <span>{file.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(file)} className="h-7 w-7">
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              {!isProcessing ? (
                <Button onClick={processFiles} disabled={files.length === 0} className="w-full sm:w-auto">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Yükle ve İşle
                </Button>
              ) : (
                <div className="pt-4 space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-muted-foreground text-center">{statusMessage}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-muted-foreground" /> Yükleme Rehberi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-700 dark:text-green-200">
                <FileSpreadsheet className="h-4 w-4 text-green-600 !-translate-y-0" />
                <AlertTitle className="font-semibold text-green-800 dark:text-green-300">Excel Dosyası (.xlsx)</AlertTitle>
                <AlertDescription className="text-green-800/90 dark:text-green-300/90 text-sm space-y-1 mt-2">
                   <p>Artık belirli bir şablona uymanız gerekmiyor! Yapay zeka, sütunlarınızı otomatik olarak tanıyacaktır. Yine de standart şablonu kullanmak işleri hızlandırabilir.</p>
                </AlertDescription>
            </Alert>
             <Alert className="bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200">
                <FileText className="h-4 w-4 text-red-600 !-translate-y-0" />
                <AlertTitle className="font-semibold text-red-800 dark:text-red-300">PDF Dosyası</AlertTitle>
                <AlertDescription className="text-red-800/90 dark:text-red-300/90 text-sm space-y-1 mt-2">
                    <p>Yapay zeka, PDF içerisindeki metinleri ve tabloları analiz ederek öğrenci sonuçlarını otomatik olarak çıkarır. Dosyanın metin tabanlı ve okunaklı olması yeterlidir.</p>
                </AlertDescription>
            </Alert>
            <Alert className="bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-200">
                <Info className="h-4 w-4 text-blue-600 !-translate-y-0" />
                <AlertTitle className="font-semibold text-blue-800 dark:text-blue-300">Temel Beklenen Veriler</AlertTitle>
                <AlertDescription className="text-blue-800/90 dark:text-blue-300/90 text-sm space-y-1 mt-2 break-all">
                    <p>AI, dosya içeriğinde şu temel bilgileri arayacaktır: Sınav Adı, Öğrenci Adı, Öğrenci No, Sınıf, Toplam Puan, Toplam Net ve Ders Netleri (Türkçe, Matematik, Fen vb.).</p>
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
