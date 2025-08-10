'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now deprecated in favor of the new student dashboard flow.
// It redirects users to the new homework page to maintain a consistent experience.
export default function DeprecatedUnitsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/student/homework');
  }, [router]);

  return null; // Render nothing as the redirect will happen
}
