"use client";

import { useParams } from "next/navigation";
import { BookForm } from "@/components/BookForm";

export default function EditBookPage() {
  const params = useParams<{ id: string }>();
  return <BookForm bookId={params.id} />;
}
