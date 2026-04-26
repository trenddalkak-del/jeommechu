// Category-based placeholder images from Unsplash
const CATEGORY_IMAGES: Record<string, string> = {
  "한식": "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=300&fit=crop",
  "중식": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=300&fit=crop",
  "일식": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop",
  "양식": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
  "치킨": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop",
  "피자": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
  "버거": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
  "분식": "https://images.unsplash.com/photo-1632709810780-b5a4343cebec?w=400&h=300&fit=crop",
  "카페": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
  "디저트": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop",
  "고기": "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop",
  "해산물": "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&h=300&fit=crop",
  "default": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
};

export function getCategoryImage(categoryName: string): string {
  if (!categoryName) return CATEGORY_IMAGES["default"];
  
  for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
    if (key === "default") continue;
    if (categoryName.includes(key)) return url;
  }
  
  return CATEGORY_IMAGES["default"];
}
