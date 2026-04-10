// Shared vendor types for studio / dress / makeup sections.
// Used by: db.ts mapping, /api/vendors/[category] routes,
// VendorFormModal, VendorListSection, WeddingApp.
//
// The three entities share the same shape (name, sub, price, note)
// so the frontend drives them through one generic component. The
// only special case is `dress`, which adds a `target` (groom|bride)
// field so the UI can sub-tab between the two.

export type VendorCategory = "studio" | "dress" | "makeup";
export type DressTarget = "groom" | "bride";

export interface Vendor {
  id: number;
  name: string;
  sub: string; // 위치
  price: number; // 만원
  note: string;
  /** Only meaningful for category === "dress". */
  target?: DressTarget;
}

export interface VendorCategoryMeta {
  id: VendorCategory;
  label: string;
  icon: string; // emoji (render with TwEmoji)
  /** DB table name — used by db.ts generic helpers. */
  table: string;
  /** `/api/vendors/<api>` path segment. */
  api: VendorCategory;
  /** Matches the sidebar SECTIONS entry id in WeddingApp.tsx. */
  sectionId: "studios" | "dresses" | "makeup";
}

export const VENDOR_CATEGORIES: Record<VendorCategory, VendorCategoryMeta> = {
  studio: {
    id: "studio",
    label: "스튜디오",
    icon: "📸",
    table: "studios",
    api: "studio",
    sectionId: "studios",
  },
  dress: {
    id: "dress",
    label: "드레스",
    icon: "👰",
    table: "dresses",
    api: "dress",
    sectionId: "dresses",
  },
  makeup: {
    id: "makeup",
    label: "메이크업",
    icon: "💄",
    table: "makeups",
    api: "makeup",
    sectionId: "makeup",
  },
};

export function isVendorCategory(x: unknown): x is VendorCategory {
  return x === "studio" || x === "dress" || x === "makeup";
}

export function isDressTarget(x: unknown): x is DressTarget {
  return x === "groom" || x === "bride";
}

export const DRESS_TARGET_META: Record<
  DressTarget,
  { label: string; icon: string }
> = {
  bride: { label: "신부", icon: "👰" },
  groom: { label: "신랑", icon: "🤵" },
};
