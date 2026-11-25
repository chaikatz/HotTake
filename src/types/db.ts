/** Shapes returned by the Hot Take database (see supabase/migrations). */

export type DisplayMode = "real" | "anonymous";
export type ReactionType = "agree" | "disagree";

export interface Profile {
  id: string;
  phone: string | null;
  real_name: string;
  display_mode: DisplayMode;
  invited_by: string | null;
  accepted_terms_at: string | null;
  created_at: string;
}

/** One take as every screen draws it (rpc `take_cards`). */
export interface TakeCard {
  id: string;
  created_at: string;
  rating: number;
  text: string;
  author_id: string;
  author_name: string;
  author_is_anonymous: boolean;
  is_mine: boolean;
  subject_id: string;
  subject_name: string;
  subject_category: string | null;
  subject_is_place: boolean;
  subject_neighborhood: string | null;
  subject_address: string | null;
  parent_id: string | null;
  parent_name: string | null;
  subject_avg: number;
  subject_take_count: number;
  is_spicy: boolean;
  agree_count: number;
  disagree_count: number;
  my_reaction: ReactionType | null;
  photos: string[];
}

export interface SubjectSummary {
  id: string;
  name: string;
  category: string | null;
  is_place: boolean;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  parent_id: string | null;
  parent_name: string | null;
  avg_rating: number | null;
  take_count: number;
}

export interface SubjectHit {
  id: string;
  name: string;
  category: string | null;
  is_place: boolean;
  neighborhood: string | null;
  address: string | null;
  parent_name: string | null;
  avg_rating: number | null;
  take_count: number;
}

export interface ChildSubject {
  id: string;
  name: string;
  category: string | null;
  avg_rating: number | null;
  take_count: number;
}

export interface MapSubject {
  id: string;
  name: string;
  category: string | null;
  lat: number;
  lng: number;
  avg_rating: number;
  take_count: number;
}

export interface Invite {
  code: string;
  used_at: string | null;
  created_at: string;
}
