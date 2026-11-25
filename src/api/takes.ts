import { useInfiniteQuery, useQuery, type InfiniteData } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { PHOTO_BUCKET, supabase } from "@/lib/supabase";
import type { ReactionType, TakeCard } from "@/types/db";

const PAGE = 20;

interface CardFilter {
  limit?: number;
  before?: string | null;
  subjectId?: string | null;
  userId?: string | null;
  ids?: string[] | null;
}

function normalize(row: TakeCard): TakeCard {
  return {
    ...row,
    rating: Number(row.rating),
    subject_avg: Number(row.subject_avg),
    photos: row.photos ?? [],
  };
}

export async function takeCards(f: CardFilter = {}): Promise<TakeCard[]> {
  const { data, error } = await supabase.rpc("take_cards", {
    p_limit: f.limit ?? PAGE,
    p_before: f.before ?? null,
    p_subject_id: f.subjectId ?? null,
    p_user_id: f.userId ?? null,
    p_ids: f.ids ?? null,
  });
  if (error) throw error;
  return ((data as TakeCard[]) ?? []).map(normalize);
}

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => takeCards({ before: pageParam }),
    getNextPageParam: (last) => (last.length < PAGE ? undefined : last[last.length - 1].created_at),
  });
}

export function useSubjectTakes(subjectId: string | undefined) {
  return useQuery({
    queryKey: ["subjectTakes", subjectId],
    enabled: !!subjectId,
    queryFn: () => takeCards({ subjectId, limit: 100 }),
  });
}

export function useUserTakes(userId: string | undefined) {
  return useQuery({
    queryKey: ["userTakes", userId],
    enabled: !!userId,
    queryFn: () => takeCards({ userId, limit: 100 }),
  });
}

export function useTakesByIds(ids: string[]) {
  return useQuery({
    queryKey: ["takesByIds", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const rows = await takeCards({ ids, limit: ids.length });
      const order = new Map(ids.map((id, i) => [id, i]));
      return rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    },
  });
}

export async function createTake(args: {
  subjectId: string;
  rating: number;
  text: string;
  photoPaths: string[];
}): Promise<string> {
  const { data, error } = await supabase.rpc("create_take", {
    p_subject_id: args.subjectId,
    p_rating: Math.round(args.rating * 10) / 10,
    p_text: args.text.trim(),
    p_photo_paths: args.photoPaths,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteTake(take: TakeCard): Promise<void> {
  const { error } = await supabase.from("takes").delete().eq("id", take.id);
  if (error) throw error;
  if (take.photos.length) {
    await supabase.storage.from(PHOTO_BUCKET).remove(take.photos);
  }
  refreshTakes();
}

/** Toggle agree/disagree. Returns the reaction now in place (or null). */
export async function react(takeId: string, type: ReactionType): Promise<ReactionType | null> {
  const { data, error } = await supabase.rpc("react_to_take", { p_take_id: takeId, p_type: type });
  if (error) throw error;
  return (data as ReactionType | null) ?? null;
}

export async function reportTake(takeId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("report_take", { p_take_id: takeId, p_reason: reason });
  if (error) throw error;
  refreshTakes();
}

export async function blockUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc("block_user", { p_user_id: userId });
  if (error) throw error;
  refreshTakes();
}

/** Re-read every list of takes after something changed. */
export function refreshTakes(): void {
  void queryClient.invalidateQueries({ queryKey: ["feed"] });
  void queryClient.invalidateQueries({ queryKey: ["subjectTakes"] });
  void queryClient.invalidateQueries({ queryKey: ["userTakes"] });
  void queryClient.invalidateQueries({ queryKey: ["takesByIds"] });
  void queryClient.invalidateQueries({ queryKey: ["subject"] });
  void queryClient.invalidateQueries({ queryKey: ["children"] });
  void queryClient.invalidateQueries({ queryKey: ["map"] });
  void queryClient.invalidateQueries({ queryKey: ["takeCount"] });
}

/** Apply a change to one take wherever it is cached, so taps feel instant. */
export function patchTake(takeId: string, patch: (t: TakeCard) => TakeCard): void {
  const fix = (t: TakeCard) => (t.id === takeId ? patch(t) : t);
  queryClient.setQueriesData<InfiniteData<TakeCard[]>>({ queryKey: ["feed"] }, (old) =>
    old ? { ...old, pages: old.pages.map((p) => p.map(fix)) } : old,
  );
  for (const key of ["subjectTakes", "userTakes", "takesByIds"]) {
    queryClient.setQueriesData<TakeCard[]>({ queryKey: [key] }, (old) => (old ? old.map(fix) : old));
  }
}
