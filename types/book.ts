export type BookStatus = "upcoming" | "available";

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  releaseDate: string;
  note?: string;
  status: BookStatus;
  /**
   * Technical marker required to distinguish an intentional manual status
   * from the status automatically derived from releaseDate.
   */
  statusOverride?: BookStatus | null;
  purchased: boolean;
  purchasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookDraft {
  title: string;
  author: string;
  publisher: string;
  releaseDate: string;
  note?: string;
  statusOverride?: BookStatus | null;
  purchased: boolean;
}
