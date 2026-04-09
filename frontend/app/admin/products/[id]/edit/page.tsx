'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// /admin/products/[id]/edit → redirects to /admin/products/[id]
export default function EditRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    router.replace(`/admin/products/${id}`);
  }, [id, router]);

  return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );
}
