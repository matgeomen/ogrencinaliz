"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, File, X, Loader2, LogIn, Database, AlertTriangle } from 'lucide-react';
import { analyzeEokulData } from '@/ai/flows/analyze-eokul-data';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Set worker source
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export default function EOkulPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfAnalysis, setPdfAnalysis] = useState('');
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Allow only one file at a time
    setFiles([acceptedFiles[0]]);
    setPdfAnalysis('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/html': ['.html', '.htm'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  const removeFile = (file: File) => {
    setFiles(prev => prev.filter(f => f !== file));
    setPdfAnalysis('');
  };

  const processFile = async () => {
    if (files.length === 0) {
      toast({ title: 'Lütfen bir dosya seçin.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    setPdfAnalysis('');

    const file = files[0];
    let textContent = '';

    try {
        if (file.type === 'application/pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const text = await page.getTextContent();
                textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ');
            }
        } else if (file.type === 'text/html' || file.type.startsWith('application/vnd.openxmlformats-officedocument')) {
             textContent = await file.text();
        } else {
            throw new Error("Desteklenmeyen dosya formatı.");
        }
        
        toast({ title: 'Dosya Okundu', description: 'Metin içeriği AI analizi için gönderiliyor...' });

        const result = await analyzeEokulData({
            eokulData: textContent,
            examName: `E-Okul Belgesi: ${file.name}`,
            studentName: 'Bilinmeyen Öğrenci', // This could be extracted from text later
            className: 'Bilinmeyen Sınıf' // This could be extracted from text later
        });
        setPdfAnalysis(result.analysis);
        toast({ title: 'E-Okul Analizi Tamamlandı', description: 'Yapay zeka analizi aşağıda gösterilmektedir.' });

    } catch (error) {
        toast({ title: `Hata: ${file.name}`, description: 'Dosya okunamadı veya analiz edilemedi.', variant: 'destructive' });
        console.error(error);
    } finally {
        setIsProcessing(false);
    }
  };


  return (
    <div className="space-y-6">
      <PageHeader title="E-Okul Verileri" description="E-Okul not bilgilerini yükleyin ve görüntüleyin" />
        
        <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="upload"><UploadCloud className="w-4 h-4 mr-2"/>Dosya Yükle</TabsTrigger>
                <TabsTrigger value="login"><LogIn className="w-4 h-4 mr-2"/>Giriş Yap</TabsTrigger>
                <TabsTrigger value="data" disabled><Database className="w-4 h-4 mr-2"/>Veriler</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <File className="h-5 w-5" />
                           Dosya ile Yükleme
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div {...getRootProps()} className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors">
                            <input {...getInputProps()} />
                            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                            {isDragActive ?
                                <p className="mt-4 text-muted-foreground">Dosyayı buraya bırakın...</p> :
                                <>
                                    <p className="mt-4 font-semibold text-foreground">E-Okul dosyasını yükleyin</p>
                                    <p className="text-sm text-muted-foreground">Excel, PDF veya HTML dosyası</p>
                                </>
                            }
                        </div>
                        {files.length > 0 && (
                            <div className="space-y-2">
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
                            <Button onClick={processFile} disabled={isProcessing || files.length === 0} className="w-full sm:w-auto">
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Analiz Et
                            </Button>
                            </div>
                        )}

                        <Alert variant="default" className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <AlertTitle className="text-yellow-800 dark:text-yellow-300">E-Okul'dan Veri Alma:</AlertTitle>
                          <AlertDescription className="text-yellow-700 dark:text-yellow-300/80 text-sm">
                            <ol className="list-decimal list-inside space-y-1 mt-2">
                                <li>E-Okul'a giriş yapın</li>
                                <li>Not Bilgileri → Öğrenci Not Bilgileri sayfasına gidin</li>
                                <li>Sayfayı yazdır (PDF olarak kaydet) veya Excel'e aktar</li>
                                <li>İndirdiğiniz dosyayı buraya yükleyin</li>
                            </ol>
                          </AlertDescription>
                        </Alert>

                    </CardContent>
                </Card>
                {pdfAnalysis && (
                  <Card className="mt-4">
                      <CardHeader>
                          <CardTitle>AI Analiz Sonucu</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <Textarea value={pdfAnalysis} readOnly className="h-64 whitespace-pre-wrap bg-secondary/50" />
                      </CardContent>
                  </Card>
                )}
            </TabsContent>
            <TabsContent value="login">
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LogIn className="h-5 w-5" />
                            E-Okul Giriş
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Alert variant="default" className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <AlertTitle className="text-yellow-800 dark:text-yellow-300">Önemli Not:</AlertTitle>
                          <AlertDescription className="text-yellow-700 dark:text-yellow-300/80 text-sm">
                            Güvenlik nedeniyle şu an için dosya yükleme yöntemini kullanmanızı öneriyoruz. Otomatik giriş özelliği geliştirme aşamasındadır.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="tc-kimlik">T.C. Kimlik No</Label>
                                <Input id="tc-kimlik" placeholder="T.C. Kimlik numaranız" disabled />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="eokul-sifre">E-Okul Şifresi</Label>
                                <Input id="eokul-sifre" type="password" placeholder="E-Okul şifreniz" disabled />
                            </div>
                            <Button size="lg" className="w-full" disabled>
                                <LogIn className="mr-2 h-4 w-4" />
                                Giriş Yap ve Verileri Çek
                            </Button>
                        </div>
                        
                        <Card className="bg-secondary/50">
                            <CardContent className="p-4 text-sm text-muted-foreground">
                                <p className="font-semibold mb-2 text-foreground">Bu özellik aktifleştiğinde:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>E-Okul'a otomatik giriş yapılacak</li>
                                    <li>Hızlı not girişi sayfasından veriler çekilecek</li>
                                    <li>Öğrenci notları otomatik kaydedilecek</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}

    