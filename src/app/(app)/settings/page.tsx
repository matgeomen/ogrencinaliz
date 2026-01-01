"use client";

import { PageHeader } from '@/components/page-header';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Ayarlar" description="Uygulama ayarlarını yönetin." />
       <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center h-96 justify-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Ayarlar
          </h3>
          <p className="text-sm text-muted-foreground">
            Bu özellik yakında aktif olacaktır.
          </p>
        </div>
      </div>
    </div>
  );
}
