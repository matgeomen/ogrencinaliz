"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Database, Save, User, UploadCloud, Info } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useData } from "@/contexts/data-context"
import { useToast } from "@/hooks/use-toast"
import { firebaseConfig } from "@/firebase/config"

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

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.gif', '.webp'] },
    multiple: false,
  });
  
  const handleSave = () => {
    // Burada kullanıcı bilgilerini kaydetme mantığı olabilir.
    // Şimdilik sadece bir bildirim gösteriyoruz.
    toast({
        title: "Profil Kaydedildi",
        description: "Kişisel bilgileriniz başarıyla güncellendi.",
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil"
        description="Hesap bilgilerinizi ve uygulama ayarlarını yönetin"
      />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/> Kişisel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-[150px_1fr] gap-8 items-start">
              <div className="flex flex-col items-center gap-2 text-center">
                  <div {...getRootProps()} className="relative cursor-pointer group">
                      <Avatar className="h-36 w-36">
                          <AvatarImage src={profileAvatar} alt="Profile Avatar"/>
                          <AvatarFallback>RH</AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <UploadCloud className="h-8 w-8 text-white"/>
                          <p className="text-xs text-white mt-1">Değiştir</p>
                      </div>
                      <input {...getInputProps()} />
                  </div>
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
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5"/> Veri Depolama (Firebase)</CardTitle>
            <CardDescription>Uygulama verileri bulutta Firebase Firestore üzerinde saklanmaktadır.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="font-semibold text-blue-800 dark:text-blue-300">Firebase Entegrasyonu Aktif</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300/80 text-sm mt-1">
                  Tüm öğrenci ve sınav verileriniz, Google'ın sunduğu güvenli ve hızlı bir bulut veritabanı olan Firebase Firestore üzerinde depolanmaktadır. Verileriniz anlık olarak kaydedilir ve tüm cihazlarınızda senkronize olur.
                </AlertDescription>
              </Alert>
              <div className="space-y-2 text-sm">
                <Label htmlFor="project-id">Bağlı Firebase Projesi</Label>
                <Input id="project-id" readOnly value={firebaseConfig.projectId} className="font-mono"/>
                 <p className="text-xs text-muted-foreground">
                    Bu proje sizin için otomatik olarak oluşturuldu. Yapılandırma detayları <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded-sm">src/firebase/config.ts</code> dosyasındadır.
                </p>
              </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4"/>
                Değişiklikleri Kaydet
            </Button>
        </div>
      </div>
    </div>
  )
}
