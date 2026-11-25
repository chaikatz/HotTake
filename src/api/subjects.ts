import { supabase } from "@/lib/supabase";
import type { ChildSubject, MapSubject, SubjectHit, SubjectSummary } from "@/types/db";

export async function searchSubjects(query: string): Promise<SubjectHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const { data, error } = await supabase.rpc("search_subjects", { p_query: q });
  if (error) throw error;
  return (data as SubjectHit[]) ?? [];
}

export interface NewSubject {
  name: string;
  category: string;
  isPlace: boolean;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  externalId?: string | null;
  parentId?: string | null;
}

/** Finds the existing subject this names, or creates it. Returns its id. */
export async function upsertSubject(s: NewSubject): Promise<string> {
  const { data, error } = await supabase.rpc("upsert_subject", {
    p_name: s.name.trim(),
    p_category: s.category,
    p_is_place: s.isPlace,
    p_address: s.address ?? null,
    p_neighborhood: s.neighborhood ?? null,
    p_city: s.city ?? null,
    p_lat: s.lat ?? null,
    p_lng: s.lng ?? null,
    p_external_id: s.externalId ?? null,
    p_parent_id: s.parentId ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function subjectSummary(id: string): Promise<SubjectSummary | null> {
  const { data, error } = await supabase.rpc("subject_summary", { p_subject_id: id });
  if (error) throw error;
  const rows = (data as SubjectSummary[]) ?? [];
  return rows[0] ?? null;
}

export async function childSubjects(id: string): Promise<ChildSubject[]> {
  const { data, error } = await supabase.rpc("child_subjects", { p_parent_id: id });
  if (error) throw error;
  return (data as ChildSubject[]) ?? [];
}

export async function mapSubjects(): Promise<MapSubject[]> {
  const { data, error } = await supabase.rpc("map_subjects");
  if (error) throw error;
  return (data as MapSubject[]) ?? [];
}
