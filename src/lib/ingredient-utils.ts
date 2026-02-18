// Shared ingredient normalization, categorization, and display utilities

// ─── Depluralization ────────────────────────────────────────────────────────

const PLURAL_EXCEPTIONS = new Set([
  "asparagus",
  "hummus",
  "couscous",
  "molasses",
  "grits",
  "oats",
  "lentils",
  "chickpeas",
  "noodles",
  "greens",
  "brussels",
  "herbs",
  "tahini",
  "miso",
  "edamame",
  "tofu",
  "tempeh",
  "quinoa",
  "farro",
  "orzo",
  "panko",
  "sriracha",
  "salsa",
]);

function depluralize(word: string): string {
  if (PLURAL_EXCEPTIONS.has(word)) return word;

  // -ries → -ry: berries→berry, cherries→cherry, strawberries→strawberry
  if (word.endsWith("ries")) return word.slice(0, -3) + "y";
  // -oes → -o: tomatoes→tomato, potatoes→potato
  if (word.endsWith("oes") && word.length > 4) return word.slice(0, -2);
  // -ches, -shes, -sses, -xes, -zes → strip -es
  if (
    word.endsWith("ches") ||
    word.endsWith("shes") ||
    word.endsWith("sses") ||
    word.endsWith("xes") ||
    word.endsWith("zes")
  )
    return word.slice(0, -2);
  // -ves → -f: leaves→leaf, halves→half
  if (word.endsWith("ves")) return word.slice(0, -3) + "f";
  // Generic -s removal with guards
  if (
    word.endsWith("s") &&
    !word.endsWith("ss") &&
    !word.endsWith("us") &&
    !word.endsWith("is") &&
    word.length > 3
  )
    return word.slice(0, -1);

  return word;
}

// ─── Normalization ──────────────────────────────────────────────────────────

export function normalizeItemName(name: string): string {
  const cleaned = name.toLowerCase().trim().replace(/\s+/g, " ");
  const words = cleaned.split(" ");
  if (words.length === 1) {
    return depluralize(words[0]);
  }
  words[words.length - 1] = depluralize(words[words.length - 1]);
  return words.join(" ");
}

export function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    tbsp: "tbsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    tsp: "tsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    cup: "cup",
    cups: "cup",
    oz: "oz",
    ounce: "oz",
    ounces: "oz",
    lb: "lb",
    lbs: "lb",
    pound: "lb",
    pounds: "lb",
    g: "g",
    gram: "g",
    grams: "g",
    ml: "ml",
    clove: "clove",
    cloves: "clove",
    piece: "piece",
    pieces: "piece",
    slice: "slice",
    slices: "slice",
    can: "can",
    cans: "can",
    bunch: "bunch",
    head: "head",
    stalk: "stalk",
    stalks: "stalk",
    whole: "whole",
    "": "unit",
    unit: "unit",
    pinch: "pinch",
    dash: "dash",
    handful: "handful",
  };

  return unitMap[unit.toLowerCase().trim()] || unit.toLowerCase().trim();
}

// ─── Category Map ───────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  // ── Produce: Vegetables ──
  onion: "produce",
  garlic: "produce",
  tomato: "produce",
  potato: "produce",
  carrot: "produce",
  celery: "produce",
  "sweet pepper": "produce",
  broccoli: "produce",
  spinach: "produce",
  lettuce: "produce",
  cucumber: "produce",
  zucchini: "produce",
  mushroom: "produce",
  avocado: "produce",
  ginger: "produce",
  cilantro: "produce",
  parsley: "produce",
  basil: "produce",
  scallion: "produce",
  "green onion": "produce",
  "bell pepper": "produce",
  jalapeño: "produce",
  jalapeno: "produce",
  corn: "produce",
  "sweet potato": "produce",
  cabbage: "produce",
  kale: "produce",
  asparagus: "produce",
  "green bean": "produce",
  pea: "produce",
  "bean sprout": "produce",
  eggplant: "produce",
  squash: "produce",
  cauliflower: "produce",
  "brussels sprout": "produce",
  artichoke: "produce",
  beet: "produce",
  turnip: "produce",
  radish: "produce",
  "snap pea": "produce",
  "snow pea": "produce",
  fennel: "produce",
  leek: "produce",
  shallot: "produce",
  endive: "produce",
  arugula: "produce",
  watercress: "produce",
  "bok choy": "produce",
  daikon: "produce",
  okra: "produce",
  rutabaga: "produce",
  parsnip: "produce",
  jicama: "produce",
  "collard green": "produce",
  radicchio: "produce",
  chive: "produce",
  dill: "produce",
  mint: "produce",
  tarragon: "produce",
  sage: "produce",
  "romaine lettuce": "produce",
  "iceberg lettuce": "produce",
  "baby spinach": "produce",
  "mixed green": "produce",
  "butternut squash": "produce",
  "acorn squash": "produce",
  "spaghetti squash": "produce",
  "red onion": "produce",
  "yellow onion": "produce",
  "white onion": "produce",
  "red pepper": "produce",
  "green pepper": "produce",
  "serrano pepper": "produce",
  "habanero pepper": "produce",
  "poblano pepper": "produce",
  "anaheim pepper": "produce",
  "cherry tomato": "produce",
  "roma tomato": "produce",
  "grape tomato": "produce",
  "baby carrot": "produce",

  // ── Produce: Fruits ──
  apple: "produce",
  banana: "produce",
  orange: "produce",
  lemon: "produce",
  lime: "produce",
  strawberry: "produce",
  blueberry: "produce",
  raspberry: "produce",
  blackberry: "produce",
  grape: "produce",
  mango: "produce",
  pineapple: "produce",
  peach: "produce",
  pear: "produce",
  plum: "produce",
  cherry: "produce",
  watermelon: "produce",
  cantaloupe: "produce",
  honeydew: "produce",
  kiwi: "produce",
  fig: "produce",
  pomegranate: "produce",
  nectarine: "produce",
  apricot: "produce",
  grapefruit: "produce",
  tangerine: "produce",
  clementine: "produce",
  cranberry: "produce",
  coconut: "produce",
  papaya: "produce",
  "green apple": "produce",
  "granny smith apple": "produce",
  plantain: "produce",
  guava: "produce",
  passionfruit: "produce",
  dragonfruit: "produce",
  lychee: "produce",
  persimmon: "produce",
  "blood orange": "produce",

  // ── Meat & Protein ──
  chicken: "meat",
  beef: "meat",
  pork: "meat",
  salmon: "meat",
  shrimp: "meat",
  fish: "meat",
  turkey: "meat",
  lamb: "meat",
  "ground beef": "meat",
  "ground turkey": "meat",
  "ground pork": "meat",
  "ground chicken": "meat",
  bacon: "meat",
  sausage: "meat",
  tofu: "meat",
  steak: "meat",
  "chicken breast": "meat",
  "chicken thigh": "meat",
  "chicken wing": "meat",
  "chicken leg": "meat",
  "chicken drumstick": "meat",
  "whole chicken": "meat",
  tuna: "meat",
  cod: "meat",
  tilapia: "meat",
  "pork chop": "meat",
  "pork tenderloin": "meat",
  "pork loin": "meat",
  "pork belly": "meat",
  "beef stew meat": "meat",
  "chuck roast": "meat",
  sirloin: "meat",
  "flank steak": "meat",
  ribeye: "meat",
  "turkey breast": "meat",
  "italian sausage": "meat",
  anchovy: "meat",
  scallop: "meat",
  crab: "meat",
  lobster: "meat",
  clam: "meat",
  mussel: "meat",
  squid: "meat",
  "smoked salmon": "meat",
  prosciutto: "meat",
  pepperoni: "meat",
  ham: "meat",
  tempeh: "meat",
  seitan: "meat",
  "hot dog": "meat",
  bratwurst: "meat",
  chorizo: "meat",
  pancetta: "meat",
  "rotisserie chicken": "meat",
  mahi: "meat",
  halibut: "meat",
  trout: "meat",
  catfish: "meat",
  "sea bass": "meat",
  snapper: "meat",

  // ── Dairy & Eggs ──
  butter: "dairy",
  cheese: "dairy",
  milk: "dairy",
  cream: "dairy",
  "sour cream": "dairy",
  yogurt: "dairy",
  "heavy cream": "dairy",
  parmesan: "dairy",
  mozzarella: "dairy",
  cheddar: "dairy",
  "cream cheese": "dairy",
  egg: "dairy",
  "feta cheese": "dairy",
  feta: "dairy",
  "greek yogurt": "dairy",
  "cottage cheese": "dairy",
  ricotta: "dairy",
  gouda: "dairy",
  "swiss cheese": "dairy",
  brie: "dairy",
  "goat cheese": "dairy",
  "blue cheese": "dairy",
  "whipped cream": "dairy",
  "half and half": "dairy",
  buttermilk: "dairy",
  provolone: "dairy",
  "jack cheese": "dairy",
  "monterey jack": "dairy",
  "pepper jack": "dairy",
  colby: "dairy",
  gruyere: "dairy",
  mascarpone: "dairy",
  "string cheese": "dairy",
  "shredded cheese": "dairy",
  "whole milk": "dairy",
  "skim milk": "dairy",
  "almond milk": "dairy",
  "oat milk": "dairy",
  "coconut milk": "pantry",

  // ── Bakery ──
  bread: "bakery",
  "hamburger bun": "bakery",
  "hot dog bun": "bakery",
  bagel: "bakery",
  croissant: "bakery",
  "pita bread": "bakery",
  pita: "bakery",
  naan: "bakery",
  sourdough: "bakery",
  "english muffin": "bakery",
  "flour tortilla": "bakery",
  "corn tortilla": "bakery",
  tortilla: "bakery",
  "pie crust": "bakery",
  "pizza dough": "bakery",
  "dinner roll": "bakery",
  ciabatta: "bakery",
  flatbread: "bakery",
  baguette: "bakery",
  brioche: "bakery",
  "sandwich bread": "bakery",
  "whole wheat bread": "bakery",
  "sourdough bread": "bakery",
  "garlic bread": "bakery",

  // ── Frozen ──
  "frozen pea": "frozen",
  "frozen corn": "frozen",
  "frozen spinach": "frozen",
  "frozen broccoli": "frozen",
  "frozen berry": "frozen",
  "frozen fruit": "frozen",
  "frozen vegetable": "frozen",
  "frozen shrimp": "frozen",
  "frozen fish": "frozen",
  "frozen pizza": "frozen",
  "ice cream": "frozen",
  "frozen waffle": "frozen",
  "frozen fry": "frozen",
  "frozen chicken": "frozen",
  "frozen edamame": "frozen",

  // ── Pantry ──
  "olive oil": "pantry",
  "vegetable oil": "pantry",
  "sesame oil": "pantry",
  "peanut oil": "pantry",
  "canola oil": "pantry",
  "avocado oil": "pantry",
  "coconut oil": "pantry",
  "cooking spray": "pantry",
  "soy sauce": "pantry",
  "fish sauce": "pantry",
  vinegar: "pantry",
  "rice vinegar": "pantry",
  "balsamic vinegar": "pantry",
  "apple cider vinegar": "pantry",
  "red wine vinegar": "pantry",
  "white wine vinegar": "pantry",
  sugar: "pantry",
  "brown sugar": "pantry",
  "powdered sugar": "pantry",
  flour: "pantry",
  "all-purpose flour": "pantry",
  "whole wheat flour": "pantry",
  "almond flour": "pantry",
  rice: "pantry",
  "brown rice": "pantry",
  "white rice": "pantry",
  "jasmine rice": "pantry",
  "basmati rice": "pantry",
  pasta: "pantry",
  noodle: "pantry",
  spaghetti: "pantry",
  penne: "pantry",
  linguine: "pantry",
  fettuccine: "pantry",
  orzo: "pantry",
  "elbow macaroni": "pantry",
  "rice noodle": "pantry",
  "egg noodle": "pantry",
  "ramen noodle": "pantry",
  "udon noodle": "pantry",
  quinoa: "pantry",
  couscous: "pantry",
  barley: "pantry",
  farro: "pantry",
  bulgur: "pantry",
  oat: "pantry",
  "rolled oat": "pantry",
  "chicken broth": "pantry",
  "beef broth": "pantry",
  "vegetable broth": "pantry",
  broth: "pantry",
  stock: "pantry",
  "chicken stock": "pantry",
  "beef stock": "pantry",
  "vegetable stock": "pantry",
  "tomato sauce": "pantry",
  "tomato paste": "pantry",
  "canned tomato": "pantry",
  "diced tomato": "pantry",
  "crushed tomato": "pantry",
  "sun-dried tomato": "pantry",
  "black bean": "pantry",
  "kidney bean": "pantry",
  "cannellini bean": "pantry",
  "pinto bean": "pantry",
  "navy bean": "pantry",
  chickpea: "pantry",
  lentil: "pantry",
  bean: "pantry",
  olive: "pantry",
  caper: "pantry",
  pickle: "pantry",
  honey: "pantry",
  "maple syrup": "pantry",
  "hot sauce": "pantry",
  "worcestershire sauce": "pantry",
  "hoisin sauce": "pantry",
  "teriyaki sauce": "pantry",
  "oyster sauce": "pantry",
  sriracha: "pantry",
  salsa: "pantry",
  tahini: "pantry",
  miso: "pantry",
  "miso paste": "pantry",
  mustard: "pantry",
  "dijon mustard": "pantry",
  "yellow mustard": "pantry",
  ketchup: "pantry",
  mayo: "pantry",
  mayonnaise: "pantry",
  "peanut butter": "pantry",
  "bread crumb": "pantry",
  panko: "pantry",
  cornstarch: "pantry",
  "baking powder": "pantry",
  "baking soda": "pantry",
  "cocoa powder": "pantry",
  "chocolate chip": "pantry",
  gelatin: "pantry",
  yeast: "pantry",
  jam: "pantry",
  "orange juice": "pantry",
  "lemon juice": "pantry",
  "lime juice": "pantry",
  wine: "pantry",
  "white wine": "pantry",
  "red wine": "pantry",
  "cooking wine": "pantry",
  beer: "pantry",

  // ── Pantry: Nuts & Seeds ──
  almond: "pantry",
  walnut: "pantry",
  pecan: "pantry",
  cashew: "pantry",
  peanut: "pantry",
  pistachio: "pantry",
  "pine nut": "pantry",
  "sunflower seed": "pantry",
  "pumpkin seed": "pantry",
  "sesame seed": "pantry",
  "chia seed": "pantry",
  "flax seed": "pantry",
  "hemp seed": "pantry",
  "mixed nut": "pantry",
  "trail mix": "pantry",

  // ── Spices ──
  salt: "spices",
  pepper: "spices",
  "black pepper": "spices",
  "white pepper": "spices",
  cumin: "spices",
  paprika: "spices",
  "smoked paprika": "spices",
  "chili powder": "spices",
  oregano: "spices",
  thyme: "spices",
  rosemary: "spices",
  "bay leaf": "spices",
  cinnamon: "spices",
  nutmeg: "spices",
  "garlic powder": "spices",
  "onion powder": "spices",
  "red pepper flake": "spices",
  turmeric: "spices",
  coriander: "spices",
  "curry powder": "spices",
  "garam masala": "spices",
  "italian seasoning": "spices",
  "cayenne pepper": "spices",
  "chili flake": "spices",
  allspice: "spices",
  cardamom: "spices",
  "star anise": "spices",
  "fennel seed": "spices",
  "mustard seed": "spices",
  "celery seed": "spices",
  saffron: "spices",
  "five spice": "spices",
  "chinese five spice": "spices",
  "taco seasoning": "spices",
  "old bay": "spices",
  "lemon pepper": "spices",
  "dried oregano": "spices",
  "dried basil": "spices",
  "dried thyme": "spices",
  "dried rosemary": "spices",
  "dried parsley": "spices",
  "dried dill": "spices",
  "chili paste": "spices",
  "vanilla extract": "spices",
  "almond extract": "spices",
  vanilla: "spices",
  "crushed red pepper": "spices",
  "ground ginger": "spices",
  "ground cumin": "spices",
  "ground cinnamon": "spices",
  "ground coriander": "spices",
  "ground turmeric": "spices",
  "ground nutmeg": "spices",
  "ground clove": "spices",
  "seasoning salt": "spices",
  "steak seasoning": "spices",
  "poultry seasoning": "spices",
};

// ─── Suffix / Keyword Heuristics ────────────────────────────────────────────

const SUFFIX_RULES: Array<{ suffix: string; category: string }> = [
  // produce
  { suffix: "berry", category: "produce" },
  { suffix: "melon", category: "produce" },
  { suffix: "pepper", category: "produce" },
  { suffix: "lettuce", category: "produce" },
  { suffix: "squash", category: "produce" },
  { suffix: "sprout", category: "produce" },
  { suffix: "green", category: "produce" },
  // dairy
  { suffix: "cheese", category: "dairy" },
  { suffix: "milk", category: "dairy" },
  { suffix: "cream", category: "dairy" },
  { suffix: "yogurt", category: "dairy" },
  // pantry
  { suffix: "sauce", category: "pantry" },
  { suffix: "vinegar", category: "pantry" },
  { suffix: "oil", category: "pantry" },
  { suffix: "broth", category: "pantry" },
  { suffix: "stock", category: "pantry" },
  { suffix: "paste", category: "pantry" },
  { suffix: "flour", category: "pantry" },
  { suffix: "sugar", category: "pantry" },
  { suffix: "syrup", category: "pantry" },
  { suffix: "noodle", category: "pantry" },
  { suffix: "bean", category: "pantry" },
  { suffix: "seed", category: "pantry" },
  { suffix: "nut", category: "pantry" },
  { suffix: "rice", category: "pantry" },
  { suffix: "juice", category: "pantry" },
  // bakery
  { suffix: "bread", category: "bakery" },
  { suffix: "bun", category: "bakery" },
  { suffix: "roll", category: "bakery" },
  { suffix: "tortilla", category: "bakery" },
  // spices
  { suffix: "powder", category: "spices" },
  { suffix: "seasoning", category: "spices" },
  { suffix: "extract", category: "spices" },
  { suffix: "spice", category: "spices" },
];

const CONTAINS_RULES: Array<{ keyword: string; category: string }> = [
  { keyword: "frozen", category: "frozen" },
  { keyword: "chicken", category: "meat" },
  { keyword: "beef", category: "meat" },
  { keyword: "pork", category: "meat" },
  { keyword: "turkey", category: "meat" },
  { keyword: "lamb", category: "meat" },
  { keyword: "fish", category: "meat" },
  { keyword: "salmon", category: "meat" },
  { keyword: "shrimp", category: "meat" },
  { keyword: "sausage", category: "meat" },
];

// ─── Categorization ─────────────────────────────────────────────────────────

export function categorizeItem(itemName: string): string | null {
  const normalized = normalizeItemName(itemName);

  // 1. Direct match
  if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized];

  // 2. Suffix heuristics
  for (const { suffix, category } of SUFFIX_RULES) {
    if (normalized.endsWith(suffix)) return category;
  }

  // 3. Contains keyword
  for (const { keyword, category } of CONTAINS_RULES) {
    if (normalized.includes(keyword)) return category;
  }

  // 4. Partial match — only check if normalized name contains a known key
  //    Require key length >= 4 to avoid false positives from short words
  for (const [key, category] of Object.entries(CATEGORY_MAP)) {
    if (key.length >= 4 && normalized.includes(key)) {
      return category;
    }
  }

  return null;
}

export const CATEGORY_ORDER = [
  "produce",
  "meat",
  "dairy",
  "bakery",
  "frozen",
  "pantry",
  "spices",
  "other",
] as const;

// ─── Display Formatting ─────────────────────────────────────────────────────

const INVARIANT_UNITS = new Set([
  "oz",
  "tbsp",
  "tsp",
  "ml",
  "g",
]);

const UNIT_PLURALS: Record<string, string> = {
  bunch: "bunches",
  dash: "dashes",
  pinch: "pinches",
  inch: "inches",
};

export function formatUnit(unit: string, quantity: number): string {
  if (unit === "unit" || unit === "") return "";
  if (quantity <= 1) return unit;
  if (INVARIANT_UNITS.has(unit)) return unit;
  if (UNIT_PLURALS[unit]) return UNIT_PLURALS[unit];
  // Default: append "s" (lb→lbs, can→cans, clove→cloves, cup→cups)
  return unit + "s";
}

export function formatDisplayQuantity(quantity: number | string): string {
  const num = typeof quantity === "string" ? parseFloat(quantity) : quantity;
  if (isNaN(num)) return String(quantity);
  if (Number.isInteger(num)) return num.toString();
  return num.toFixed(1);
}

export function formatItemQuantity(quantity: number | string, unit: string): string {
  const num = typeof quantity === "string" ? parseFloat(quantity) : quantity;
  const qty = formatDisplayQuantity(quantity);
  const u = formatUnit(unit, num);
  return u ? `${qty} ${u}` : qty;
}
