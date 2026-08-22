export type BookStatus = "upcoming" | "available" | "unknown";
export type ReleaseDatePrecision = "year" | "month" | "day";

export interface Book {
  id: string;
  title?: string;
  author?: string;
  series?: string;
  volume?: string;
  publisher?: string;
  releaseDate: string;
  note?: string;
  purchased: boolean;
  purchasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookDraft {
  title?: string;
  author?: string;
  series?: string;
  volume?: string;
  publisher?: string;
  releaseDate: string;
  note?: string;
  purchased: boolean;
}
