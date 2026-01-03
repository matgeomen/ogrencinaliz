"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sun, KeyRound, ExternalLink, Trash2, Eye, EyeOff, Moon, Laptop, Link as LinkIcon, FileSpreadsheet, Info, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [showApiKey, setShowApiKey] = useState(false);
    const [showClientSecret, setShowClientSecret] = useState(false);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Ayarlar"
                description="Uygulama ayarlarını yönetin"
            />
            <div className="space-y-6 max-w-3xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5"/> Yapay Zeka API Anahtarı</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex items-center gap-2">
                           <div className="relative flex-grow">
                                <Input id="api-key" type={showApiKey ? "text" : "password"} placeholder="API anahtarı..." />
                                <Button variant="ghost" size="icon" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7">
                                    {showApiKey ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                </Button>
                            </div>
                            <Button>Kaydet</Button>
                       </div>
                       <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                             <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                             <AlertTitle className="text-blue-800 dark:text-blue-300 font-semibold">Bilgi:</AlertTitle>
                             <AlertDescription className="text-blue-700 dark:text-blue-300/80 text-sm">
                                <ul className="list-disc list-inside space-y-1 mt-1">
                                    <li>API anahtarı girilmezse sistem varsayılan anahtarı kullanır</li>
                                    <li>Gemini API: PDF işleme ve AI analizi için</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5"/> Google Sheets Entegrasyonu</CardTitle>
                        <CardDescription>Verilerinizi Google Sheets'e senkronize edin</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                            <div className="flex items-center gap-3">
                                 <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                                 <div>
                                    <p className="font-semibold">Bağlı Değil</p>
                                    <p className="text-sm text-muted-foreground">Bağlanmak için aşağıdaki bilgileri girin</p>
                                 </div>
                            </div>
                            <Button><LinkIcon className="mr-2 h-4 w-4" /> Bağlan</Button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="client-id">Google Client ID</Label>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Kaydedildi
                                    </Badge>
                                </div>
                                <div className="relative">
                                    <Input id="client-id" placeholder="Client ID..." />
                                     <Button variant="ghost" size="icon" disabled className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7">
                                        <Eye className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="client-secret">Google Client Secret</Label>
                                <div className="relative">
                                    <Input id="client-secret" type={showClientSecret ? "text" : "password"} placeholder="Client Secret..." />
                                     <Button variant="ghost" size="icon" onClick={() => setShowClientSecret(!showClientSecret)} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7">
                                        {showClientSecret ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button className="w-full sm:w-auto">
                                <FileSpreadsheet className="mr-2 h-4 w-4"/>
                                Google Bilgilerini Kaydet
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
