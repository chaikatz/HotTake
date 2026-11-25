/**
 * Turns a question into SQL filters for `ai_candidate_takes`. No model and no
 * vectors: keywords, category words, and New York neighborhoods with a
 * centre point and radius. Kept dependency-free so it can be unit tested.
 */

export interface Area {
  names: string[];
  lat: number;
  lng: number;
  radius: number;
}

export interface Filters {
  terms: string[];
  categories: string[] | null;
  area: { label: string; lat: number; lng: number; radius: number; names: string[] } | null;
  nearMe: boolean;
}

// Approximate centres; radius in metres. Downtown-first, since that's where launch is.
export const NYC_AREAS: Area[] = [
  { names: ["soho"], lat: 40.7233, lng: -74.003, radius: 900 },
  { names: ["noho"], lat: 40.7262, lng: -73.993, radius: 550 },
  { names: ["nolita"], lat: 40.7229, lng: -73.9955, radius: 550 },
  { names: ["tribeca"], lat: 40.7163, lng: -74.0086, radius: 800 },
  { names: ["west village"], lat: 40.7358, lng: -74.0036, radius: 800 },
  { names: ["greenwich village", "the village"], lat: 40.7336, lng: -73.999, radius: 900 },
  { names: ["east village"], lat: 40.7265, lng: -73.9815, radius: 900 },
  { names: ["lower east side", "les"], lat: 40.715, lng: -73.9843, radius: 900 },
  { names: ["chinatown"], lat: 40.7158, lng: -73.997, radius: 550 },
  { names: ["little italy"], lat: 40.7191, lng: -73.9973, radius: 400 },
  { names: ["financial district", "fidi"], lat: 40.7075, lng: -74.0113, radius: 800 },
  { names: ["battery park city"], lat: 40.7116, lng: -74.0158, radius: 700 },
  { names: ["meatpacking", "meatpacking district"], lat: 40.741, lng: -74.007, radius: 450 },
  { names: ["chelsea"], lat: 40.7465, lng: -74.0014, radius: 1000 },
  { names: ["flatiron"], lat: 40.741, lng: -73.9897, radius: 650 },
  { names: ["nomad"], lat: 40.7448, lng: -73.9881, radius: 500 },
  { names: ["gramercy"], lat: 40.7368, lng: -73.9845, radius: 600 },
  { names: ["union square"], lat: 40.7359, lng: -73.9911, radius: 500 },
  { names: ["murray hill"], lat: 40.7479, lng: -73.9757, radius: 800 },
  { names: ["koreatown", "k-town", "ktown"], lat: 40.7478, lng: -73.9866, radius: 400 },
  { names: ["midtown"], lat: 40.7549, lng: -73.984, radius: 1500 },
  { names: ["hell's kitchen", "hells kitchen"], lat: 40.7638, lng: -73.9918, radius: 900 },
  { names: ["upper west side", "uws"], lat: 40.787, lng: -73.9754, radius: 1700 },
  { names: ["upper east side", "ues"], lat: 40.7736, lng: -73.9566, radius: 1700 },
  { names: ["harlem"], lat: 40.8116, lng: -73.9465, radius: 1700 },
  { names: ["williamsburg"], lat: 40.7081, lng: -73.9571, radius: 1600 },
  { names: ["greenpoint"], lat: 40.7304, lng: -73.9515, radius: 1100 },
  { names: ["bushwick"], lat: 40.6958, lng: -73.9171, radius: 1400 },
  { names: ["dumbo"], lat: 40.7033, lng: -73.9881, radius: 450 },
  { names: ["brooklyn heights"], lat: 40.696, lng: -73.9933, radius: 700 },
  { names: ["cobble hill"], lat: 40.686, lng: -73.9969, radius: 550 },
  { names: ["carroll gardens"], lat: 40.6795, lng: -73.9991, radius: 650 },
  { names: ["boerum hill"], lat: 40.6848, lng: -73.9845, radius: 550 },
  { names: ["fort greene"], lat: 40.6892, lng: -73.9742, radius: 750 },
  { names: ["park slope"], lat: 40.671, lng: -73.9814, radius: 1300 },
  { names: ["prospect heights"], lat: 40.6775, lng: -73.9692, radius: 750 },
  { names: ["crown heights"], lat: 40.6694, lng: -73.9422, radius: 1600 },
  { names: ["bed stuy", "bed-stuy", "bedstuy", "bedford stuyvesant", "bedford-stuyvesant"], lat: 40.6872, lng: -73.9418, radius: 1600 },
  { names: ["red hook"], lat: 40.6734, lng: -74.0083, radius: 1000 },
  { names: ["astoria"], lat: 40.7644, lng: -73.9235, radius: 1600 },
  { names: ["long island city", "lic"], lat: 40.7447, lng: -73.9485, radius: 1300 },
  { names: ["downtown manhattan", "lower manhattan", "downtown"], lat: 40.718, lng: -74.0, radius: 2600 },
  { names: ["manhattan"], lat: 40.7831, lng: -73.9712, radius: 9000 },
  { names: ["brooklyn"], lat: 40.6782, lng: -73.9442, radius: 9000 },
  { names: ["queens"], lat: 40.7282, lng: -73.7949, radius: 12000 },
  { names: ["new york city", "new york", "nyc"], lat: 40.7306, lng: -73.9866, radius: 30000 },
];

// Words that name a kind of thing rather than a thing.
const CATEGORY_WORDS: Record<string, string[]> = {
  restaurant: ["restaurant", "dish", "cafe", "bakery"],
  restaurants: ["restaurant", "dish", "cafe", "bakery"],
  dinner: ["restaurant", "dish"],
  lunch: ["restaurant", "dish", "cafe"],
  brunch: ["restaurant", "dish", "cafe"],
  breakfast: ["restaurant", "dish", "cafe", "bakery"],
  food: ["restaurant", "dish", "cafe", "bakery"],
  eat: ["restaurant", "dish", "cafe", "bakery"],
  eats: ["restaurant", "dish", "cafe", "bakery"],
  meal: ["restaurant", "dish"],
  dish: ["dish"],
  dishes: ["dish"],
  plate: ["dish"],
  cafe: ["cafe"],
  cafes: ["cafe"],
  "café": ["cafe"],
  bar: ["bar", "drink"],
  bars: ["bar", "drink"],
  drink: ["drink", "bar"],
  drinks: ["drink", "bar"],
  cocktail: ["drink", "bar"],
  cocktails: ["drink", "bar"],
  bakery: ["bakery"],
  bakeries: ["bakery"],
  movie: ["film"],
  movies: ["film"],
  film: ["film"],
  films: ["film"],
  show: ["film"],
  shows: ["film"],
  tv: ["film"],
  series: ["film"],
  product: ["product"],
  products: ["product"],
  album: ["music"],
  albums: ["music"],
  song: ["music"],
  songs: ["music"],
  music: ["music"],
  coffee: ["cafe"],
  espresso: ["cafe"],
  latte: ["cafe"],
  wine: ["bar", "drink"],
  beer: ["bar", "drink"],
  shop: ["store"],
  shops: ["store"],
  store: ["store"],
  stores: ["store"],
};

// Specific things that are also kinds: keep them as search terms too.
const ALSO_TERMS = new Set(["coffee", "espresso", "latte", "cocktail", "cocktails", "wine", "beer"]);

const STOPWORDS = new Set(
  (
    "a an the and or but of in on at to for from with by about into over near around is are was were be been " +
    "what whats what's which who whom whose where when why how is it its it's this that these those there here " +
    "i me my mine we us our you your yours they them their he she his her do does did done doing have has had " +
    "should would could can will shall may might must get got go going went good great best top better nice " +
    "place places spot spots thing things people person someone anyone anybody everyone say says said think thinks " +
    "thought rated rating ratings rate take takes hot opinion opinions review reviews recommend recommendation " +
    "recommendations any some all most more much many very really just like love loved want need find tell know " +
    "show me please right now today tonight new worth try trying city area neighborhood neighbourhood " +
    "nearby close by walking distance than then so if also only actually one ones lot lots kind sort favorite favourite " +
    "hottest coldest worst overrated underrated popular spiciest raving rave raves watching watch watched eating " +
    "eaten drinking visit visiting buy buying worth overall ever still yet else other ok okay anything something " +
    "everything where's who's go-to goto spot's next week weekend date"
  ).split(/\s+/),
);

const NEAR_ME = /\b(near me|nearby|around here|close by|near here|walking distance|around me)\b/i;

function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.length > 4 && word.endsWith("es") && /(ches|shes|sses|xes)$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

export function parseQuestion(question: string): Filters {
  let q = ` ${question.toLowerCase().replace(/[’']/g, "'")} `;
  const nearMe = NEAR_ME.test(q);
  if (nearMe) q = q.replace(NEAR_ME, " ");

  // Longest neighborhood names first so "east village" beats "village".
  let area: Filters["area"] = null;
  const candidates = NYC_AREAS.flatMap((a) => a.names.map((n) => ({ n, a }))).sort((x, y) => y.n.length - x.n.length);
  for (const { n, a } of candidates) {
    const re = new RegExp(`(^|[^a-z])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i");
    if (re.test(q)) {
      area = { label: a.names[0], lat: a.lat, lng: a.lng, radius: a.radius, names: a.names };
      q = q.replace(re, " ");
      break;
    }
  }

  const words = q.split(/[^a-z0-9'&-]+/i).map((w) => w.replace(/^'+|'+$/g, "")).filter(Boolean);
  const categories = new Set<string>();
  const terms: string[] = [];
  for (const w of words) {
    if (CATEGORY_WORDS[w]) {
      for (const c of CATEGORY_WORDS[w]) categories.add(c);
      if (!ALSO_TERMS.has(w)) continue;
    }
    if (STOPWORDS.has(w)) continue;
    if (w.length < 3 && !/^\d+$/.test(w)) continue;
    const s = stem(w.replace(/'s$/, ""));
    if (s.length >= 3 && !terms.includes(s)) terms.push(s);
  }

  return {
    terms: terms.slice(0, 8),
    categories: categories.size ? [...categories] : null,
    area,
    nearMe,
  };
}
