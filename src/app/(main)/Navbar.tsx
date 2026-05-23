import SearchField from "@/components/SearchField";
import UserButton from "@/components/UserButton";
import BalanceDisplay from "@/components/BalanceDisplay";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-card shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-5 px-5 py-3">
        <Link href="/" className="flex shrink-0 items-center" aria-label="StarRail home">
          <Image
            src="/starrail-logo.png"
            alt="StarRail"
            width={144}
            height={40}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>
        <SearchField />
        <BalanceDisplay />
        <UserButton className="sm:ms-auto " />
      </div>
    </header>
  );
}
