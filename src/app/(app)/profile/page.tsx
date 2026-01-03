"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database, Save, User, Settings, UploadCloud } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { useData } from "@/contexts/data-context"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { profileAvatar, setProfileAvatar } = useData();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Dosya Boyutu Çok Büyük",
          description: "Lütfen 2MB'den küçük bir resim dosyası seçin.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileAvatar(result);
        toast({
          title: "Profil Resmi Güncellendi",
          description: "Yeni profil resminiz başarıyla yüklendi ve kaydedildi.",
        });
      };
      reader.readAsDataURL(file);
    }
  }, [setProfileAvatar, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.gif', '.webp'] },
    multiple: false,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil"
        description="Hesap bilgilerinizi yönetin"
      />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/> Kişisel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-[150px_1fr] gap-8 items-start">
              <div {...getRootProps()} className="relative flex flex-col items-center gap-2 text-center cursor-pointer group">
                  <Avatar className="h-36 w-36">
                      <AvatarImage src={profileAvatar} alt="Profile Avatar"/>
                      <AvatarFallback>RH</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <UploadCloud className="h-8 w-8 text-white"/>
                      <p className="text-xs text-white mt-1">Değiştir</p>
                  </div>
                  <input {...getInputProps()} />
                   <p className="text-xs text-muted-foreground mt-2">Profil resminizi değiştirmek için üzerine tıklayın.</p>
              </div>
              <div className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="name">Ad Soyad</Label>
                      <Input id="name" defaultValue="Rıdvan Hoca" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="email">E-posta</Label>
                      <Input id="email" type="email" defaultValue="ridvan.ozkan.183@gmail.com" />
                  </div>
              </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5"/> Veri Depolama</CardTitle>
          </CardHeader>
          <CardContent className="max-w-md space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="storage">Depolama Tercihi</Label>
                  <Select defaultValue="cloud">
                      <SelectTrigger id="storage">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="local">Sadece Yerel (MongoDB)</SelectItem>
                          <SelectItem value="cloud">Sadece Bulut (Google Sheets)</SelectItem>
                          <SelectItem value="both">Her İkisi</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <Alert variant="default" className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                <AlertTitle className="font-semibold text-yellow-800 dark:text-yellow-300">Google Sheets Kurulumu:</AlertTitle>
                <AlertDescription className="text-yellow-700 dark:text-yellow-300/80 text-sm mt-1">
                  Bulut depolama için Ayarlar sayfasından bağlantı yapın.
                </AlertDescription>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4"/>
                    Ayarlara Git
                  </Link>
                </Button>
              </Alert>
          </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button>
                <Save className="mr-2 h-4 w-4"/>
                Kaydet
            </Button>
        </div>
      </div>
    </div>
  )
}
