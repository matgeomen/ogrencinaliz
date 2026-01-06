"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sun, KeyRound, Eye, EyeOff, Moon, Laptop, Settings as SettingsIcon, Sparkles, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Info } from "lucide-react";
import Link from "next/link";
import { useData } from "@/contexts/data-context";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { apiKey, setApiKey } = useData();
    const { user, firestore } = useFirebase();
    const { toast } = useToast();

    const [currentApiKey, setCurrentApiKey] = useState(apiKey || '');
    const [showApiKey, setShowApiKey] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        if (apiKey) {
            setCurrentApiKey(apiKey);
        }
    }, [apiKey]);
    
    const handleSaveApiKey = async () => {
        if (!user || !firestore) {
            toast({ title: "Kullanıcı bulunamadı", description: "Ayarları kaydetmek için giriş yapmalısınız.", variant: "destructive" });
            return;
        }

        try {
            // Update context and local storage
            setApiKey(currentApiKey);

            // Update Firestore
            const userDocRef = doc(firestore, "users", user.uid);
            await setDoc(userDocRef, {
                apiKey: currentApiKey,
            }, { merge: true });

            toast({
                title: "API Anahtarı Kaydedildi",
                description: `API anahtarınız hem yerel olarak hem de bulutta güncellendi.`,
            });
        } catch (error: any) {
            console.error("API Key save error:", error);
            toast({
                title: "Hata",
                description: "API Anahtarı kaydedilirken bir hata oluştu: " + error.message,
                variant: "destructive",
            });
        }
    }


    if (!mounted) {
        return null;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Ayarlar"
                description="Uygulama ayarlarını yönetin"
            />
            <div className="space-y-6 max-w-3xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Görünüm</CardTitle>
                        <CardDescription>Uygulamanın görünümünü özelleştirin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <RadioGroup
                            value={theme}
                            onValueChange={setTheme}
                            className="grid max-w-md grid-cols-4 gap-4 pt-2"
                        >
                            <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                 <RadioGroupItem value="light" className="sr-only" />
                                <Sun className="h-6 w-6" />
                                <span className="mt-2">Açık</span>
                            </Label>
                            <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                 <RadioGroupItem value="dark" className="sr-only" />
                                <Moon className="h-6 w-6" />
                                <span className="mt-2">Koyu</span>
                            </Label>
                             <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                <RadioGroupItem value="system" className="sr-only" />
                                <Laptop className="h-6 w-6" />
                                <span className="mt-2">Sistem</span>
                            </Label>
                             <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                <RadioGroupItem value="premium" className="sr-only" />
                                <Sparkles className="h-6 w-6" />
                                <span className="mt-2">Premium</span>
                            </Label>
                        </RadioGroup>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5"/> Yapay Zeka API Anahtarı</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex items-center gap-2">
                           <div className="relative flex-grow">
                                <Input id="api-key" type={showApiKey ? "text" : "password"} placeholder="API anahtarınızı buraya yapıştırın..." value={currentApiKey} onChange={(e) => setCurrentApiKey(e.target.value)} />
                                <Button variant="ghost" size="icon" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7">
                                    {showApiKey ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                </Button>
                            </div>
                            <Button onClick={handleSaveApiKey}>
                                <Save className="mr-2 h-4 w-4" />
                                Kaydet
                            </Button>
                       </div>
                       <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                             <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                             <AlertTitle className="text-blue-800 dark:text-blue-300 font-semibold">API Anahtarı Nasıl Alınır?</AlertTitle>
                             <AlertDescription className="text-blue-700 dark:text-blue-300/80 text-sm">
                                <ol className="list-decimal list-inside space-y-1 mt-1">
                                    <li><Link href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-medium underline">Google AI Studio</Link> adresine gidin.</li>
                                    <li>"Create API key" (API anahtarı oluştur) butonuna tıklayın.</li>
                                    <li>Oluşturulan anahtarı kopyalayıp yukarıdaki alana yapıştırın ve kaydedin.</li>
                                </ol>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5"/> Sistem Bilgisi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Versiyon</span>
                            <span className="font-medium">2.0.0 (Firebase)</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">AI Motoru</span>
                            <span className="font-medium">Gemini 1.5 Flash (Latest)</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Veritabanı</span>
                            <span className="font-medium">Firebase Firestore</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
