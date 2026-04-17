export interface VisitNote {
  id: number;
  complexId: number | null;
  title: string;
  content: string;
  pros: string;
  cons: string;
  rating: number; // 0-5
  photos: string[]; // base64 data URIs
  visitedAt: string; // YYYY-MM-DD or ""
  createdAt: string;
  updatedAt: string;
}
