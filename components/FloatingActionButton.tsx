import Link from "next/link";
import { PlusIcon } from "@/components/Icons";

export function FloatingActionButton() {
  return (
    <Link
      href="/book/new"
      aria-label="Ajouter un livre"
      className="fixed bottom-[max(20px,env(safe-area-inset-bottom))] right-5 z-20 grid size-14 place-items-center rounded-full bg-brass text-paper transition-transform duration-150 ease-out hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass active:scale-95 motion-reduce:transition-none sm:right-[max(20px,calc((100vw-640px)/2+20px))]"
    >
      <PlusIcon className="size-6" />
    </Link>
  );
}
