import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { globalSearch } from '@/app/actions/global-search';
import SearchClient from './search-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function LoadingSearch() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Searching nearby...</p>
      </div>
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { zip?: string; q?: string };
}) {
  const zipCode = searchParams.zip;
  const searchQuery = searchParams.q || '';

  // If no zip code provided, redirect to home
  if (!zipCode || !/^\d{5}$/.test(zipCode)) {
    redirect('/');
  }

  // Perform the search
  const results = await globalSearch(zipCode, searchQuery);

  return (
    <Suspense fallback={<LoadingSearch />}>
      <SearchClient results={results} zipCode={zipCode} searchQuery={searchQuery} />
    </Suspense>
  );
}
