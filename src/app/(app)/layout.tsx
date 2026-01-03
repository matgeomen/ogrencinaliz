"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { DataProvider, useData } from '@/contexts/data-context';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  Users,
  FileText,
  BarChart3,
  Trophy,
  FileBox,
  Upload,
  GraduationCap,
  BrainCircuit,
  Database,
  Settings
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const navItems = [
  { href: '/dashboard', label: 'Kontrol Merkezi', icon: LayoutGrid },
  { href: '/students', label: 'Öğrenciler', icon: Users },
  { href: '/exams', label: 'Denemeler', icon: FileText },
  { href: '/analytics', label: 'Analizler', icon: BarChart3 },
  { href: '/rankings', label: 'Sıralamalar', icon: Trophy },
  { href: '/reports', label: 'Raporlar', icon: FileBox },
  { href: '/e-okul', label: 'E-Okul Verileri', icon: Database },
  { href: '/ai-analysis', label: 'AI Analiz', icon: BrainCircuit },
  { href: '/upload', label: 'Veri Yükleme', icon: Upload },
];

function AppHeader() {
  const { exams, selectedExam, setSelectedExam, loading, profileAvatar } = useData();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex-1">
        <h1 className="text-lg font-semibold md:hidden">
          Öğrenci Takip
        </h1>
      </div>
      <div className="flex flex-1 items-center justify-end gap-4">
        {!isMounted ? (
            <>
              <Skeleton className="h-10 w-[250px]" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </>
        ) : (
          <>
            <div className="w-full max-w-[250px] min-w-[200px]">
              <Select
                value={selectedExam}
                onValueChange={setSelectedExam}
                disabled={loading || exams.length === 0}
              >
                <SelectTrigger id="exam-dropdown">
                  <SelectValue placeholder="Deneme Seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam} value={exam}>{exam}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                     <AvatarImage src={profileAvatar} alt="User Avatar" />
                    <AvatarFallback>ÖT</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Rıdvan Hoca</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      ridvan.ozkan.183@gmail.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Ayarlar</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Çıkış Yap</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}

function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="hidden border-r-0 md:flex"
    >
      <SidebarHeader>
        <Button variant="ghost" asChild className="h-auto justify-start gap-2 px-2 text-base">
          <Link href="/dashboard">
            <GraduationCap className="size-6 shrink-0" />
            <span className="font-headline text-lg font-semibold">Öğrenci Takip</span>
          </Link>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')} tooltip="Ayarlar">
                    <Link href="/settings">
                        <Settings />
                        <span>Ayarlar</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
            <AppHeader />
            <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </DataProvider>
  );
}
