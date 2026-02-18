// Shared ingredient normalization and categorization utilities
// Used by both grocery list generation (Ollama) and manual add-to-list

export const CATEGORY_MAP: Record<string, string> = {
  // Produce
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
  lemon: "produce",
  lime: "produce",
  ginger: "produce",
  cilantro: "produce",
  parsley: "produce",
  basil: "produce",
  scallion: "produce",
  "green onion": "produce",
  "bell pepper": "produce",
  jalapeño: "produce",
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

  // Meat & protein
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
  bacon: "meat",
  sausage: "meat",
  tofu: "meat",
  steak: "meat",
  "chicken breast": "meat",
  "chicken thigh": "meat",
  tuna: "meat",
  cod: "meat",
  tilapia: "meat",

  // Dairy
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
  eggs: "dairy",
  "feta cheese": "dairy",

  // Pantry
  "olive oil": "pantry",
  "vegetable oil": "pantry",
  "soy sauce": "pantry",
  "fish sauce": "pantry",
  vinegar: "pantry",
  sugar: "pantry",
  flour: "pantry",
  rice: "pantry",
  pasta: "pantry",
  noodle: "pantry",
  "chicken broth": "pantry",
  "beef broth": "pantry",
  broth: "pantry",
  stock: "pantry",
  "coconut milk": "pantry",
  "tomato sauce": "pantry",
  "tomato paste": "pantry",
  "canned tomato": "pantry",
  beans: "pantry",
  lentil: "pantry",
  "sesame oil": "pantry",
  honey: "pantry",
  "maple syrup": "pantry",
  "hot sauce": "pantry",
  "worcestershire sauce": "pantry",
  mustard: "pantry",
  ketchup: "pantry",
  mayo: "pantry",
  mayonnaise: "pantry",
  "peanut butter": "pantry",
  "bread crumbs": "pantry",
  panko: "pantry",
  cornstarch: "pantry",
  "baking powder": "pantry",
  tortilla: "pantry",
  bread: "pantry",

  // Spices
  salt: "spices",
  pepper: "spices",
  "black pepper": "spices",
  cumin: "spices",
  paprika: "spices",
  "chili powder": "spices",
  oregano: "spices",
  thyme: "spices",
  rosemary: "spices",
  "bay leaf": "spices",
  cinnamon: "spices",
  nutmeg: "spices",
  "garlic powder": "spices",
  "onion powder": "spices",
  "red pepper flakes": "spices",
  turmeric: "spices",
  coriander: "spices",
  "curry powder": "spices",
  "garam masala": "spices",
  "italian seasoning": "spices",
  "smoked paprika": "spices",
  "cayenne pepper": "spices",
  "chili flakes": "spices",
};

export function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/s$/, ""); // basic depluralize
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

export function categorizeItem(itemName: string): string | null {
  const normalized = normalizeItemName(itemName);

  // Direct match
  if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized];

  // Partial match — check if the item contains a known key
  for (const [key, category] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
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
