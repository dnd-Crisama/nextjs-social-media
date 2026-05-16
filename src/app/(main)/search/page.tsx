import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import SearchResults from "./SearchResults";

interface PageProps {
  searchParams: Promise<{ q: string; type?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: "${q}"` : "Search",
  };
}

export default async function Page({ searchParams }: PageProps) {
  const { q, type } = await searchParams;
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <SearchResults query={q || ""} initialTab={(type as "posts" | "users") || "posts"} />
      </div>
      <TrendsSidebar />
    </main>
  );
}