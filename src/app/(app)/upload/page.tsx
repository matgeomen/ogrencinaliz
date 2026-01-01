"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/data-context';
import * as XLSX from 'xlsx';
import { StudentExamResult } from '@/types';
import { UploadCloud, File as FileIcon, X, Loader2, Download, AlertCircle, FileSpreadsheet, FileText, CheckCircle, Info } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Set worker source
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}


export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { addStudentData } = useData();

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
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        if (file.name.endsWith('.xlsx')) {
          await processExcel(file);
          successCount++;
        } else if (file.name.endsWith('.pdf')) {
          // PDF processing might not directly add data but could be used for analysis
          // For now, let's just acknowledge it's processed.
          // await processPdf(file); // This is not defined in the original context to add data
          toast({ title: "PDF Dosyası Algılandı", description: "PDF dosyaları şu anda sadece E-Okul sayfasında analiz edilmektedir.", variant: "default" });
        }
      } catch (error) {
        errorCount++;
      }
    }
    
    if (successCount > 0) {
      toast({ title: "İşlem Tamamlandı", description: `${successCount} Excel dosyası başarıyla işlendi ve veriler eklendi.` });
    }
    if (errorCount > 0) {
       toast({ title: "Bazı Hatalar Oluştu", description: `${errorCount} dosya işlenirken hata oluştu.`, variant: 'destructive' });
    }

    setIsProcessing(false);
    setFiles([]); // Clear files after processing
  };

  const processExcel = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as any[];

          const requiredCols = ['exam_name', 'student_no', 'student_name'];
          const firstRow = json[0];
          if (!firstRow || !requiredCols.every(col => col in firstRow)) {
              throw new Error("Excel dosyasında gerekli sütunlar (exam_name, student_no, student_name) bulunamadı.");
          }
          
          const formattedData: StudentExamResult[] = json.map(row => ({
            exam_name: String(row.exam_name), date: String(row.date) || new Date().toISOString().split('T')[0], class: String(row.class) || 'N/A', student_no: Number(row.student_no), student_name: String(row.student_name),
            toplam_dogru: Number(row.toplam_dogru) || 0, toplam_yanlis: Number(row.toplam_yanlis) || 0, toplam_net: Number(row.toplam_net) || 0, toplam_puan: Number(row.toplam_puan) || 0,
            turkce_d: Number(row.turkce_d) || 0, turkce_y: Number(row.turkce_y) || 0, turkce_net: Number(row.turkce_net) || 0,
            tarih_d: Number(row.tarih_d) || 0, tarih_y: Number(row.tarih_y) || 0, tarih_net: Number(row.tarih_net) || 0,
            din_d: Number(row.din_d) || 0, din_y: Number(row.din_y) || 0, din_net: Number(row.din_net) || 0,
            ing_d: Number(row.ing_d) || 0, ing_y: Number(row.ing_y) || 0, ing_net: Number(row.ing_net) || 0,
            mat_d: Number(row.mat_d) || 0, mat_y: Number(row.mat_y) || 0, mat_net: Number(row.mat_net) || 0,
            fen_d: Number(row.fen_d) || 0, fen_y: Number(row.fen_y) || 0, fen_net: Number(row.fen_net) || 0,
          }));
          
          addStudentData(formattedData);
          resolve();

        } catch (error: any) {
          toast({ title: `Hata: ${file.name}`, description: error.message || 'Excel dosyası işlenemedi.', variant: 'destructive' });
          reject(error);
        }
      };
      reader.onerror = (error) => {
        toast({ title: `Hata: ${file.name}`, description: 'Dosya okunurken bir hata oluştu.', variant: 'destructive' });
        reject(error);
      }
      reader.readAsArrayBuffer(file);
    });
  };


  return (
    <div className="space-y-6">
      <PageHeader title="Veri Yükleme" description="Excel veya PDF dosyası yükleyin" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dosya Yükle</CardTitle>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Excel Şablonu</Button>
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
                <p className="text-sm text-muted-foreground">veya tıklayarak seçin (Excel veya PDF)</p>
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
                      {file.type.includes('spreadsheet') ? 
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
              <Button onClick={processFiles} disabled={isProcessing || files.length === 0} className="w-full sm:w-auto">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Yükle ve İşle
              </Button>
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
                   <ul className="list-disc list-inside space-y-1">
                      <li>Şablonu indirip kullanın</li>
                      <li>Sütun başlıkları değiştirilmemeli</li>
                      <li>Her satır bir öğrencinin bir denemedeki sonucunu temsil eder</li>
                   </ul>
                </AlertDescription>
            </Alert>
             <Alert className="bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200">
                <FileText className="h-4 w-4 text-red-600 !-translate-y-0" />
                <AlertTitle className="font-semibold text-red-800 dark:text-red-300">PDF Dosyası</AlertTitle>
                <AlertDescription className="text-red-800/90 dark:text-red-300/90 text-sm space-y-1 mt-2">
                    <ul className="list-disc list-inside space-y-1">
                        <li>AI ile otomatik parse edilir</li>
                        <li>Tablo formatı önerilir</li>
                        <li>Okunaklı kalite gerekli</li>
                    </ul>
                </AlertDescription>
            </Alert>
            <Alert className="bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-200">
                <Info className="h-4 w-4 text-blue-600 !-translate-y-0" />
                <AlertTitle className="font-semibold text-blue-800 dark:text-blue-300">Gerekli Sütunlar</AlertTitle>
                <AlertDescription className="text-blue-800/90 dark:text-blue-300/90 text-sm space-y-1 mt-2 break-all">
                    <p className="font-mono text-xs">
                        exam_name, date, class, student_no, student_name, toplam_dogru, toplam_yanlis, toplam_net, toplam_puan, turkce_d, turkce_y, turkce_net, tarih_d, tarih_y, tarih_net, din_d, din_y, din_net, ing_d, ing_y, ing_net, mat_d, mat_y, mat_net, fen_d, fen_y, fen_net
                    </p>
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
