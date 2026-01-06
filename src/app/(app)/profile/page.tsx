"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Database, Save, User, UploadCloud, Info, Wifi, WifiOff, CloudCog, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useData } from "@/contexts/data-context"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useFirebase } from "@/firebase"
import { cn } from "@/lib/utils"
import { doc, setDoc } from "firebase/firestore"

type StoragePreference = 'local' | 'cloud' | 'both';

export default function ProfilePage() {
  const { 
    profileAvatar, setProfileAvatar, 
    storagePreference, setStoragePreference, 
    userProfile, loading 
  } = useData();
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [currentAvatar, setCurrentAvatar] = useState(profileAvatar);
  const [currentStoragePref, setCurrentStoragePref] = useState(storagePreference);

  useEffect(() => {
    if (userProfile) {
        setDisplayName(userProfile.displayName || user?.displayName || '');
        setCurrentAvatar(userProfile.photoURL || profileAvatar);
        setCurrentStoragePref(userProfile.storagePreference || storagePreference);
    } else if (user) {
        setDisplayName(user.displayName || '');
        setCurrentAvatar(profileAvatar);
        setCurrentStoragePref(storagePreference);
    }
  }, [user, userProfile, profileAvatar, storagePreference]);
  
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
        setCurrentAvatar(result);
        toast({ title: "Profil Resmi Hazır", description: "Değişiklikleri kaydetmek için butona basın." });
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.gif', '.webp'] },
    multiple: false,
  });

  const handleSavePreferences = async () => {
    if (!user || !firestore) {
        toast({ title: "Kullanıcı bulunamadı", description: "Ayarları kaydetmek için giriş yapmalısınız.", variant: "destructive" });
        return;
    }

    try {
        // Update local state and local storage immediately
        setProfileAvatar(currentAvatar);
        setStoragePreference(currentStoragePref);

        // Update Firestore Document with all data
        const userDocRef = doc(firestore, "users", user.uid);
        await setDoc(userDocRef, {
            displayName: displayName,
            photoURL: currentAvatar,
            storagePreference: currentStoragePref,
        }, { merge: true });

        toast({
            title: "Profil ve Ayarlar Kaydedildi",
            description: `Bilgileriniz başarıyla kaydedildi.`,
        });

    } catch (error: any) {
        console.error("Profile save error:", error);
        toast({
            title: "Hata",
            description: "Profil kaydedilirken bir hata oluştu: " + error.message,
            variant: "destructive",
        });
    }
  }
  
  if (loading) {
      return (
          <div className="flex h-[80vh] w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
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
                          <AvatarImage src={currentAvatar} alt="Profile Avatar"/>
                          <AvatarFallback>{displayName?.substring(0, 2) || user?.email?.substring(0,2) || 'XX'}</AvatarFallback>
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
                      <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="email">E-posta</Label>
                      <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
                  </div>
              </div>
          </CardContent>
        </Card>
        
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5"/> Veri Depolama Tercihi</CardTitle>
                <CardDescription>Uygulama verilerinin nerede saklanacağını seçin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <RadioGroup value={currentStoragePref} onValueChange={(value) => setCurrentStoragePref(value as StoragePreference)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
                        <RadioGroupItem value="local" className="sr-only" />
                        <WifiOff className="h-8 w-8 mb-2" />
                        <span className="font-semibold">Sadece Yerel</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">Veriler sadece bu cihazda saklanır.</span>
                    </Label>
                    <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
                        <RadioGroupItem value="cloud" className="sr-only" />
                        <Wifi className="h-8 w-8 mb-2 text-blue-500" />
                        <span className="font-semibold">Sadece Bulut</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">Veriler Firebase'de saklanır, internet gerekir.</span>
                    </Label>
                    <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
                        <RadioGroupItem value="both" className="sr-only" />
                         <div className="flex items-center justify-center mb-2">
                            <WifiOff className="h-6 w-6" />
                            <span className="mx-1">+</span>
                            <Wifi className="h-6 w-6 text-blue-500" />
                        </div>
                        <span className="font-semibold">Her İkisi de</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">Bulutta saklanır ve yerel yedeği tutulur.</span>
                    </Label>
                </RadioGroup>

                {(currentStoragePref === 'cloud' || currentStoragePref === 'both') && (
                    <Card className="bg-secondary/50">
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base"><CloudCog className="h-5 w-5 text-blue-600"/> Firebase Yapılandırması</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Alert variant={user ? "default" : "destructive"} className={cn(
                                user 
                                ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                                : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                            )}>
                                <Info className={cn("h-4 w-4", user ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")} />
                                <AlertTitle className={cn("font-semibold", user ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300")}>
                                    {user ? "Firebase Bağlantısı Aktif" : "Firebase Bağlantısı Kurulamadı"}
                                </AlertTitle>
                                <AlertDescription className={cn("text-sm", user ? "text-green-700 dark:text-green-300/80" : "text-red-700 dark:text-red-300/80")}>
                                    {user ? "Uygulama başarıyla Firebase projenize bağlandı." : "Firebase'e bağlanılamadı. Lütfen internet bağlantınızı ve ayarlarınızı kontrol edin."}
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                )}
            </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button onClick={handleSavePreferences}>
                <Save className="mr-2 h-4 w-4"/>
                Profili ve Tercihleri Kaydet
            </Button>
        </div>
      </div>
    </div>
  )
}
