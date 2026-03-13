import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import SearchResults from "./SearchResults";

interface PageProps {
  searchParams: { q: string; type?: string };
}

export function generateMetadata({ searchParams: { q } }: PageProps): Metadata {
  return {
    title: q ? `Search: "${q}"` : "Search",
  };
}

export default function Page({ searchParams: { q, type } }: PageProps) {
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <SearchResults query={q || ""} initialTab={(type as "posts" | "users") || "posts"} />
      </div>
      <TrendsSidebar />
    </main>
  );
}