export interface RestaurantCard {
  id: string;
  kakaoPlaceId: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  rating: number | null;
  distance: string;
  address: string;
  phone: string;
  placeUrl: string;
}

export type SwipeDirection = "left" | "right";

export type EventType =
  | "card_view_duration"
  | "detail_click"
  | "result_ignored"
  | "swipe_hesitation"
  | "category_time_pattern"
  | "weather_choice";
