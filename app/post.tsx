import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { uploadPhoto } from "@/api/photos";
import { placeSearchSource, placeSubtitle, searchPlaces, type Place } from "@/api/places";
import { searchSubjects, upsertSubject } from "@/api/subjects";
import { createTake, refreshTakes, takeCards } from "@/api/takes";
import { Button } from "@/components/Button";
import { HeatBadge } from "@/components/HeatBadge";
import { HeatMeter } from "@/components/HeatMeter";
import { useDebounced } from "@/hooks/useDebounced";
import { useMyLocation } from "@/hooks/useMyLocation";
import { useSession } from "@/providers/SessionProvider";
import { colors, heatColor, radii } from "@/theme";
import type { SubjectHit } from "@/types/db";
import { categoryEmoji, CREATABLE } from "@/utils/categories";
import { errorMessage } from "@/utils/errors";
import { haptic } from "@/utils/haptics";

const MAX_CHARS = 280;
const MAX_PHOTOS = 4;

type Chosen =
  | { kind: "existing"; id: string; name: string; category: string | null; meta: string }
  | { kind: "place"; place: Place }
  | { kind: "new"; name: string; category: string; at: Place | null };

function chosenName(c: Chosen): string {
  return c.kind === "existing" ? c.name : c.kind === "place" ? c.place.name : c.name;
}
function chosenEmoji(c: Chosen): string {
  return categoryEmoji(c.kind === "existing" ? c.category : c.kind === "place" ? c.place.category : c.category);
}
function chosenMeta(c: Chosen): string {
  if (c.kind === "existing") return c.meta;
  if (c.kind === "place") return placeSubtitle(c.place);
  return c.at ? `at ${c.at.name}` : "";
}

interface Picked {
  uri: string;
  width?: number;
  height?: number;
}

export default function Post() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ subjectId?: string; subjectName?: string }>();
  const { profile, session } = useSession();
  const [step, setStep] = useState(params.subjectId ? 1 : 0);
  const [chosen, setChosen] = useState<Chosen | null>(
    params.subjectId
      ? { kind: "existing", id: params.subjectId, name: params.subjectName ?? "", category: null, meta: "" }
      : null,
  );
  const [rating, setRating] = useState(5);
  const [touchedRating, setTouchedRating] = useState(false);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [posting, setPosting] = useState(false);
  const [done, setDone] = useState<null | { spicy: boolean; subjectId: string }>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/feed"));

  const post = async () => {
    if (!chosen || !session || !profile) return;
    setPosting(true);
    try {
      let subjectId: string;
      if (chosen.kind === "existing") {
        subjectId = chosen.id;
      } else if (chosen.kind === "place") {
        subjectId = await upsertPlace(chosen.place);
      } else {
        const parentId = chosen.at ? await upsertPlace(chosen.at) : null;
        subjectId = await upsertSubject({
          name: chosen.name,
          category: chosen.category,
          isPlace: false,
          address: chosen.at?.address ?? null,
          neighborhood: chosen.at?.neighborhood ?? null,
          city: chosen.at?.city ?? null,
          lat: chosen.at?.lat ?? null,
          lng: chosen.at?.lng ?? null,
          parentId,
        });
      }
      const paths = await Promise.all(photos.map((p) => uploadPhoto(session.user.id, p)));
      const takeId = await createTake({ subjectId, rating, text, photoPaths: paths });
      refreshTakes();
      let spicy = false;
      try {
        const [card] = await takeCards({ ids: [takeId], limit: 1 });
        spicy = !!card?.is_spicy;
      } catch {
        // the take is posted either way
      }
      haptic.success();
      setDone({ spicy, subjectId });
    } catch (e) {
      haptic.warning();
      Alert.alert("Couldn't post that", errorMessage(e));
    } finally {
      setPosting(false);
    }
  };

  if (done) return <Posted spicy={done.spicy} rating={rating} onDone={close} subjectId={done.subjectId} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={() => (step > 0 && !(step === 1 && params.subjectId) ? setStep(step - 1) : close())}
          hitSlop={12}
          style={styles.headerBtn}
          accessibilityLabel={step > 0 ? "Back" : "Close"}
        >
          <Ionicons name={step > 0 && !(step === 1 && params.subjectId) ? "chevron-back" : "close"} size={26} color={colors.ink} />
        </Pressable>
        <View style={styles.progress}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.progressSeg, i <= step && { backgroundColor: i === 1 && step >= 1 ? heatColor(rating) : colors.ink }]} />
          ))}
        </View>
        <View style={styles.headerBtn} />
      </View>

      {step === 0 ? (
        <PickSubject
          onPick={(c) => {
            haptic.medium();
            setChosen(c);
            setStep(1);
          }}
        />
      ) : null}

      {step === 1 && chosen ? (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text style={styles.stepTitle}>How hot is it?</Text>
            <SubjectChip chosen={chosen} />
          </Animated.View>
          <HeatMeter
            value={rating}
            onChange={(v) => {
              setRating(v);
              setTouchedRating(true);
            }}
          />
          <View style={{ paddingBottom: Math.max(insets.bottom, 16), paddingTop: 12 }}>
            <Button
              title={touchedRating ? `Lock in ${rating.toFixed(1)}` : "Drag the bar to rate"}
              onPress={() => {
                haptic.heavy();
                setStep(2);
              }}
              disabled={!touchedRating}
            />
          </View>
        </View>
      ) : null}

      {step === 2 && chosen ? (
        <SayIt
          chosen={chosen}
          rating={rating}
          text={text}
          setText={setText}
          photos={photos}
          setPhotos={setPhotos}
          posting={posting}
          onEditRating={() => setStep(1)}
          onPost={post}
          bottomInset={insets.bottom}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

async function upsertPlace(p: Place): Promise<string> {
  return upsertSubject({
    name: p.name,
    category: p.category,
    isPlace: true,
    address: p.address || null,
    neighborhood: p.neighborhood || null,
    city: p.city || null,
    lat: p.lat,
    lng: p.lng,
    externalId: p.id,
  });
}

function SubjectChip({ chosen }: { chosen: Chosen }) {
  const meta = chosenMeta(chosen);
  return (
    <View style={styles.chip}>
      <Text style={{ fontSize: 20 }}>{chosenEmoji(chosen)}</Text>
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.chipName} numberOfLines={1}>
          {chosenName(chosen)}
        </Text>
        {meta ? (
          <Text style={styles.chipMeta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 1: what's the take on?
// ---------------------------------------------------------------------------

function PickSubject({ onPick }: { onPick: (c: Chosen) => void }) {
  const [query, setQuery] = useState("");
  const q = useDebounced(query.trim(), 250);
  const { location, quiet } = useMyLocation();
  const [creating, setCreating] = useState<null | { name: string; category: string | null }>(null);

  useEffect(() => {
    void quiet();
  }, [quiet]);

  const existing = useQuery({ queryKey: ["searchSubjects", q], queryFn: () => searchSubjects(q), enabled: q.length >= 1 });
  const places = useQuery({
    queryKey: ["searchPlaces", q, location?.lat, location?.lng],
    queryFn: () => searchPlaces(q, location),
    enabled: q.length >= 2,
  });

  // Hide map results that are already Hot Take subjects with the same name.
  const existingNames = useMemo(
    () => new Set((existing.data ?? []).map((s) => s.name.toLowerCase())),
    [existing.data],
  );
  const placeResults = (places.data ?? []).filter((p) => !existingNames.has(p.name.toLowerCase())).slice(0, 8);

  if (creating) {
    return (
      <CreateSubject
        name={creating.name}
        onBack={() => setCreating(null)}
        onDone={(category, at) => onPick({ kind: "new", name: creating.name, category, at })}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.stepTitle}>What's the take on?</Text>
        <View style={styles.search}>
          <Ionicons name="search" size={20} color={colors.inkFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="A restaurant, dish, film, anything…"
            placeholderTextColor={colors.inkFaint}
            style={styles.searchInput}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color={colors.inkFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 60 }}>
        {!q ? (
          <View style={styles.tips}>
            <Text style={styles.tip}>🍝 Try a restaurant: “Torrisi”</Text>
            <Text style={styles.tip}>🎬 Or anything else: “Oppenheimer”, “oat milk”, “the L train”</Text>
            <Text style={styles.tipSmall}>Takes on the same thing land together, so pick an existing one when you see it.</Text>
          </View>
        ) : null}

        {existing.data && existing.data.length ? (
          <Section title="On Hot Take">
            {existing.data.map((s) => (
              <ExistingRow key={s.id} s={s} onPress={() =>
                onPick({
                  kind: "existing",
                  id: s.id,
                  name: s.name,
                  category: s.category,
                  meta: [s.parent_name ? `at ${s.parent_name}` : null, s.neighborhood].filter(Boolean).join(" · "),
                })
              } />
            ))}
          </Section>
        ) : null}

        {q.length >= 2 ? (
          <Section title={placeSearchSource() === "apple" ? "Places · Apple Maps" : "Places"} loading={places.isFetching}>
            {placeResults.map((p) => (
              <Pressable key={p.id} onPress={() => onPick({ kind: "place", place: p })} style={styles.row}>
                <View style={styles.rowIcon}>
                  <Text style={{ fontSize: 18 }}>{categoryEmoji(p.category)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {placeSubtitle(p) || "Place"}
                  </Text>
                </View>
                <Ionicons name="add-circle" size={22} color={colors.inkFaint} />
              </Pressable>
            ))}
            {!places.isFetching && placeResults.length === 0 ? <Text style={styles.none}>No places found.</Text> : null}
          </Section>
        ) : null}

        {q.length >= 1 ? (
          <Pressable onPress={() => setCreating({ name: query.trim(), category: null })} style={[styles.row, styles.createRow]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.ink }]}>
              <Ionicons name="add" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName} numberOfLines={1}>
                New: “{query.trim()}”
              </Text>
              <Text style={styles.rowMeta}>A dish, product, film, idea…</Text>
            </View>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Section({ title, loading, children }: { title: string; loading?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {loading ? <ActivityIndicator size="small" color={colors.inkFaint} /> : null}
      </View>
      {children}
    </View>
  );
}

function ExistingRow({ s, onPress }: { s: SubjectHit; onPress: () => void }) {
  const meta = [s.parent_name ? `at ${s.parent_name}` : null, s.neighborhood, `${s.take_count} ${s.take_count === 1 ? "take" : "takes"}`]
    .filter(Boolean)
    .join(" · ");
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowIcon}>
        <Text style={{ fontSize: 18 }}>{categoryEmoji(s.category)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName} numberOfLines={1}>
          {s.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <HeatBadge rating={s.avg_rating == null ? null : Number(s.avg_rating)} size="sm" />
    </Pressable>
  );
}

function CreateSubject(props: { name: string; onBack: () => void; onDone: (category: string, at: Place | null) => void }) {
  const [category, setCategory] = useState<string | null>(null);
  const [placeQuery, setPlaceQuery] = useState("");
  const pq = useDebounced(placeQuery.trim(), 300);
  const { location } = useMyLocation();
  const places = useQuery({ queryKey: ["searchPlaces", pq, location?.lat], queryFn: () => searchPlaces(pq, location), enabled: pq.length >= 2 });
  const wantsPlace = category === "dish" || category === "drink";

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <Pressable onPress={props.onBack} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 }}>
        <Ionicons name="chevron-back" size={16} color={colors.inkSoft} />
        <Text style={{ color: colors.inkSoft, fontWeight: "700" }}>Search again</Text>
      </Pressable>
      <Text style={styles.stepTitle}>“{props.name}” is a…</Text>
      <View style={styles.cats}>
        {CREATABLE.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => {
              haptic.tick();
              setCategory(c.id);
              if (c.id !== "dish" && c.id !== "drink") props.onDone(c.id, null);
            }}
            style={[styles.cat, category === c.id && styles.catOn]}
          >
            <Text style={{ fontSize: 18 }}>{c.emoji}</Text>
            <Text style={[styles.catText, category === c.id && { color: "#fff" }]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      {wantsPlace && category ? (
        <Animated.View entering={FadeIn} style={{ marginTop: 24 }}>
          <Text style={styles.sectionTitle}>Where? (optional)</Text>
          <Text style={styles.tipSmall}>Tie it to a restaurant or bar so it shows on the map and on that place's page.</Text>
          <View style={[styles.search, { marginTop: 10 }]}>
            <Ionicons name="location-outline" size={20} color={colors.inkFaint} />
            <TextInput
              value={placeQuery}
              onChangeText={setPlaceQuery}
              placeholder="Search a place"
              placeholderTextColor={colors.inkFaint}
              style={styles.searchInput}
              autoFocus
              autoCorrect={false}
            />
          </View>
          {(places.data ?? []).slice(0, 6).map((p) => (
            <Pressable key={p.id} onPress={() => props.onDone(category, p)} style={styles.row}>
              <View style={styles.rowIcon}>
                <Text style={{ fontSize: 18 }}>{categoryEmoji(p.category)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {placeSubtitle(p)}
                </Text>
              </View>
            </Pressable>
          ))}
          <Button title="Skip — no place" variant="soft" size="md" style={{ marginTop: 14 }} onPress={() => props.onDone(category, null)} />
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Step 3: say it
// ---------------------------------------------------------------------------

function SayIt(props: {
  chosen: Chosen;
  rating: number;
  text: string;
  setText: (t: string) => void;
  photos: Picked[];
  setPhotos: (p: Picked[]) => void;
  posting: boolean;
  onEditRating: () => void;
  onPost: () => void;
  bottomInset: number;
}) {
  const { chosen, rating, text, setText, photos, setPhotos, posting } = props;
  const left = MAX_CHARS - text.length;

  const addPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted && perm.accessPrivileges !== "limited") {
      Alert.alert("Photos are off", "Allow photo access in Settings to add photos to takes.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 1,
    });
    if (res.canceled) return;
    haptic.light();
    setPhotos([...photos, ...res.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }))].slice(0, MAX_PHOTOS));
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <Text style={styles.stepTitle}>Say it.</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <SubjectChip chosen={chosen} />
          </View>
          <Pressable onPress={props.onEditRating} accessibilityLabel="Change rating">
            <HeatBadge rating={rating} size="lg" />
          </Pressable>
        </View>

        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={(v) => setText(v.slice(0, MAX_CHARS))}
            placeholder={rating >= 8 ? "Why is it so good? Be specific 🔥" : rating <= 3 ? "Why is it so bad? Be honest 🧊" : "What's your take?"}
            placeholderTextColor={colors.inkFaint}
            style={styles.textArea}
            multiline
            autoFocus
            maxLength={MAX_CHARS}
            textAlignVertical="top"
          />
          <Text style={[styles.counter, left <= 20 && { color: colors.hot }]}>{left}</Text>
        </View>

        <View style={styles.photos}>
          {photos.map((p, i) => (
            <View key={p.uri} style={styles.photoWrap}>
              <Image source={{ uri: p.uri }} style={styles.photo} contentFit="cover" />
              <Pressable onPress={() => setPhotos(photos.filter((_, j) => j !== i))} style={styles.photoX} hitSlop={8}>
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
          {photos.length < MAX_PHOTOS ? (
            <Pressable onPress={addPhotos} style={[styles.photoWrap, styles.addPhoto]}>
              <Ionicons name="camera-outline" size={24} color={colors.inkSoft} />
              <Text style={styles.addPhotoText}>{photos.length ? "More" : "Photos"}</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.tipSmall}>Up to 4 photos · optional</Text>
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: Math.max(props.bottomInset, 12) }}>
        <Button title="Post take 🔥" variant="hot" onPress={props.onPost} loading={posting} disabled={text.trim().length < 1} />
      </View>
    </View>
  );
}

function Posted({ spicy, rating, onDone, subjectId }: { spicy: boolean; rating: number; onDone: () => void; subjectId: string }) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const id = setTimeout(onDone, spicy ? 3000 : 2200);
    return () => clearTimeout(id);
  }, [onDone, spicy]);
  return (
    <View style={[styles.posted, { paddingTop: insets.top }]}>
      <Animated.Text entering={ZoomIn.springify().damping(8)} style={{ fontSize: 96 }}>
        {spicy ? "🌶️" : "🔥"}
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(120)} style={styles.postedTitle}>
        {spicy ? "Spicy take!" : "Take posted!"}
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(220)} style={styles.postedBody}>
        {spicy
          ? `Your ${rating.toFixed(1)} is 2+ points from the crowd. Let them argue.`
          : "It's live in the feed, on the map and in the AI's brain."}
      </Animated.Text>
      <Animated.View entering={FadeIn.delay(400)} style={{ marginTop: 28, flexDirection: "row", gap: 10 }}>
        <Button title="See it" variant="soft" size="md" onPress={() => {
          onDone();
          setTimeout(() => router.push(`/subject/${subjectId}`), 50);
        }} />
        <Button title="Done" size="md" onPress={onDone} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 6 },
  headerBtn: { width: 44, height: 40, justifyContent: "center" },
  progress: { flex: 1, flexDirection: "row", gap: 6, paddingHorizontal: 10 },
  progressSeg: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.line },
  stepTitle: { fontSize: 32, fontWeight: "900", color: colors.ink, letterSpacing: -1, marginTop: 8, marginBottom: 14 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 14,
    height: 54,
  },
  searchInput: { flex: 1, fontSize: 17, color: colors.ink, fontWeight: "600" },
  tips: { gap: 10, marginTop: 8 },
  tip: { fontSize: 15, color: colors.inkSoft, fontWeight: "600" },
  tipSmall: { fontSize: 13, color: colors.inkFaint, marginTop: 6, lineHeight: 18 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.inkFaint, letterSpacing: 0.6, textTransform: "uppercase" },
  none: { color: colors.inkFaint, paddingVertical: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  createRow: { marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: 16 },
  rowIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.sunken, alignItems: "center", justifyContent: "center" },
  rowName: { fontSize: 16, fontWeight: "800", color: colors.ink },
  rowMeta: { fontSize: 13, color: colors.inkSoft, marginTop: 1 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
    maxWidth: "100%",
  },
  chipName: { fontSize: 15, fontWeight: "800", color: colors.ink },
  chipMeta: { fontSize: 12, color: colors.inkSoft },
  cats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  catOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  catText: { fontSize: 15, fontWeight: "800", color: colors.ink },
  composer: { marginTop: 16, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1.5, borderColor: colors.line, padding: 14, minHeight: 150 },
  textArea: { fontSize: 19, lineHeight: 26, color: colors.ink, minHeight: 110, fontWeight: "500" },
  counter: { alignSelf: "flex-end", fontSize: 13, fontWeight: "800", color: colors.inkFaint },
  photos: { flexDirection: "row", gap: 10, marginTop: 16, flexWrap: "wrap" },
  photoWrap: { width: 76, height: 76, borderRadius: 14, overflow: "hidden" },
  photo: { width: "100%", height: "100%" },
  photoX: { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  addPhoto: { borderWidth: 1.5, borderColor: colors.lineStrong, borderStyle: "dashed", alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  addPhotoText: { fontSize: 12, fontWeight: "700", color: colors.inkSoft, marginTop: 2 },
  posted: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, paddingHorizontal: 32 },
  postedTitle: { fontSize: 36, fontWeight: "900", color: colors.ink, letterSpacing: -1, marginTop: 8 },
  postedBody: { fontSize: 17, color: colors.inkSoft, textAlign: "center", marginTop: 8, lineHeight: 24 },
});
