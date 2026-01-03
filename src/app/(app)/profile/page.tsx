"use client"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database, Save, User, Settings } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

export default function ProfilePage() {
  const profileAvatar = PlaceHolderImages.find(img => img.id === 'profile-avatar');

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
          <CardContent className="grid md:grid-cols-[120px_1fr] gap-8 items-start">
              <div className="flex flex-col items-center gap-2 text-center">
                  <Avatar className="h-32 w-32 cursor-pointer">
                      {profileAvatar && <AvatarImage src={profileAvatar.imageUrl} alt="Profile Avatar" data-ai-hint={profileAvatar.imageHint}/>}
                      <AvatarFallback>RH</AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-muted-foreground">Profil resminizi değiştirmek için üzerine tıklayın</p>
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
