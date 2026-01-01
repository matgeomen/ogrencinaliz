"use client";

import { PageHeader } from '@/components/page-header';

export default function EOkulPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="E-Okul Verileri" description="E-Okul entegrasyonu ve veri yönetimi." />
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center h-96 justify-center">
          <h3 className="text-2xl font-bold tracking-tight">
            E-Okul Verileri
          </h3>
          <p className="text-sm text-muted-foreground">
            Bu özellik yakında aktif olacaktır.
          </p>
        </div>
      </div>
    </div>
  );
}
