'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RestaurantsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main page with delivery tab
    router.replace('/?tab=delivery');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirecionando...</p>
    </div>
  );
}
