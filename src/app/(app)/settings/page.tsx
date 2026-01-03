"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sun, KeyRound, ExternalLink, Trash2, Eye, EyeOff, Moon, Laptop } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [showOpenAiKey, setShowOpenAiKey] = useState(false);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Ayarlar"
                description="Uygulama ayarlarını yönetin"
            />
            <div className="space-y-6 max-w-3xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sun className="h-5 w-5"/> Görünüm</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <RadioGroup
                            value={theme}
                            onValueChange={setTheme}
                            className="grid grid-cols-3 gap-8 pt-2"
                        >
                            <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                <RadioGroupItem value="light" id="light" className="sr-only" />
                                <Sun className="mb-3 h-6 w-6" />
                                Açık
                            </Label>
                            <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                <RadioGroupItem value="dark" id="dark" className="sr-only" />
                                <Moon className="mb-3 h-6 w-6" />
                                Koyu
                            </Label>
                             <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                <RadioGroupItem value="system" id="system" className="sr-only" />
                                <Laptop className="mb-3 h-6 w-6" />
                                Sistem
                            </Label>
                        </RadioGroup>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5"/> Yapay Zeka API Anahtarları</CardTitle>
                        <CardDescription>PDF işleme ve AI analizi için API anahtarları</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            {/* Google Gemini */}
                            <div className="p-4 border rounded-lg bg-secondary/30">
                                <div className="flex items-center justify-between mb-2">
                                    <Label htmlFor="gemini-key" className="text-base font-semibold flex items-center gap-2">
                                        Google Gemini
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">✓ Aktif</Badge>
                                    </Label>
                                    <Button variant="link" size="sm" asChild>
                                        <a href="#" target="_blank" rel="noopener noreferrer">
                                            API Anahtarı Al <ExternalLink className="ml-1.5 h-3.5 w-3.5"/>
                                        </a>
                                    </Button>
                                </div>
                                <div className="relative">
                                    <Input id="gemini-key" type="password" value="********************" readOnly />
                                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>

                            {/* OpenAI */}
                            <div className="p-4 border rounded-lg">
                                 <div className="flex items-center justify-between mb-2">
                                    <Label htmlFor="openai-key" className="text-base font-semibold">OpenAI</Label>
                                     <Button variant="link" size="sm" asChild>
                                        <a href="#" target="_blank" rel="noopener noreferrer">
                                            API Anahtarı Al <ExternalLink className="ml-1.5 h-3.5 w-3.5"/>
                                        </a>
                                    </Button>
                                </div>
                                <div className="relative flex items-center gap-2">
                                    <Input id="openai-key" type={showOpenAiKey ? "text" : "password"} placeholder="API anahtarı..." />
                                     <Button variant="ghost" size="icon" onClick={() => setShowOpenAiKey(!showOpenAiKey)} className="h-7 w-7">
                                        {showOpenAiKey ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                    </Button>
                                    <Button size="sm">
                                        Kaydet
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                             <AlertDescription className="text-sm">
                                API anahtarı girilmezse sistem varsayılan anahtarı kullanır.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
