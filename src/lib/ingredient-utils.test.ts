import { describe, test, expect } from "bun:test";
import {
  normalizeItemName,
  normalizeUnit,
  categorizeItem,
  formatUnit,
  formatDisplayQuantity,
  formatItemQuantity,
} from "./ingredient-utils";

// ─── normalizeItemName ──────────────────────────────────────────────────────

describe("normalizeItemName", () => {
  test("regular plurals", () => {
    expect(normalizeItemName("Apples")).toBe("apple");
    expect(normalizeItemName("Carrots")).toBe("carrot");
    expect(normalizeItemName("Lemons")).toBe("lemon");
    expect(normalizeItemName("Onions")).toBe("onion");
  });

  test("-oes words", () => {
    expect(normalizeItemName("tomatoes")).toBe("tomato");
    expect(normalizeItemName("potatoes")).toBe("potato");
  });

  test("-ies/-ries words", () => {
    expect(normalizeItemName("berries")).toBe("berry");
    expect(normalizeItemName("cherries")).toBe("cherry");
    expect(normalizeItemName("strawberries")).toBe("strawberry");
    expect(normalizeItemName("blueberries")).toBe("blueberry");
  });

  test("-ches/-shes words", () => {
    expect(normalizeItemName("peaches")).toBe("peach");
    expect(normalizeItemName("radishes")).toBe("radish");
  });

  test("-ves words", () => {
    expect(normalizeItemName("leaves")).toBe("leaf");
    expect(normalizeItemName("halves")).toBe("half");
  });

  test("words ending in -us are preserved", () => {
    expect(normalizeItemName("asparagus")).toBe("asparagus");
    expect(normalizeItemName("hummus")).toBe("hummus");
    expect(normalizeItemName("couscous")).toBe("couscous");
  });

  test("words ending in -ss are preserved", () => {
    expect(normalizeItemName("grass")).toBe("grass");
  });

  test("exception words are preserved", () => {
    expect(normalizeItemName("lentils")).toBe("lentils");
    expect(normalizeItemName("chickpeas")).toBe("chickpeas");
    expect(normalizeItemName("oats")).toBe("oats");
    expect(normalizeItemName("noodles")).toBe("noodles");
    expect(normalizeItemName("greens")).toBe("greens");
    expect(normalizeItemName("herbs")).toBe("herbs");
  });

  test("compound names — depluralize last word only", () => {
    expect(normalizeItemName("Green Beans")).toBe("green bean");
    expect(normalizeItemName("Bell Peppers")).toBe("bell pepper");
    expect(normalizeItemName("Sweet Potatoes")).toBe("sweet potato");
    expect(normalizeItemName("Cherry Tomatoes")).toBe("cherry tomato");
    expect(normalizeItemName("Brussels Sprouts")).toBe("brussels sprout");
  });

  test("already-singular words unchanged", () => {
    expect(normalizeItemName("chicken breast")).toBe("chicken breast");
    expect(normalizeItemName("olive oil")).toBe("olive oil");
    expect(normalizeItemName("garlic")).toBe("garlic");
  });

  test("collapses whitespace and lowercases", () => {
    expect(normalizeItemName("  Chicken   Breast  ")).toBe("chicken breast");
  });

  test("short words (≤3 chars) not stripped", () => {
    expect(normalizeItemName("gas")).toBe("gas");
    expect(normalizeItemName("bus")).toBe("bus");
  });
});

// ─── normalizeUnit ──────────────────────────────────────────────────────────

describe("normalizeUnit", () => {
  test("standard normalizations", () => {
    expect(normalizeUnit("tablespoons")).toBe("tbsp");
    expect(normalizeUnit("teaspoons")).toBe("tsp");
    expect(normalizeUnit("cups")).toBe("cup");
    expect(normalizeUnit("pounds")).toBe("lb");
    expect(normalizeUnit("ounces")).toBe("oz");
    expect(normalizeUnit("grams")).toBe("g");
  });

  test("empty string to unit", () => {
    expect(normalizeUnit("")).toBe("unit");
  });

  test("already canonical", () => {
    expect(normalizeUnit("tbsp")).toBe("tbsp");
    expect(normalizeUnit("lb")).toBe("lb");
    expect(normalizeUnit("cup")).toBe("cup");
  });
});

// ─── categorizeItem ─────────────────────────────────────────────────────────

describe("categorizeItem", () => {
  test("fruits → produce", () => {
    expect(categorizeItem("apple")).toBe("produce");
    expect(categorizeItem("Apples")).toBe("produce");
    expect(categorizeItem("Bananas")).toBe("produce");
    expect(categorizeItem("Strawberries")).toBe("produce");
    expect(categorizeItem("mango")).toBe("produce");
    expect(categorizeItem("Watermelon")).toBe("produce");
  });

  test("vegetables → produce", () => {
    expect(categorizeItem("onion")).toBe("produce");
    expect(categorizeItem("Carrots")).toBe("produce");
    expect(categorizeItem("cauliflower")).toBe("produce");
    expect(categorizeItem("brussels sprouts")).toBe("produce");
    expect(categorizeItem("bok choy")).toBe("produce");
  });

  test("meat & protein", () => {
    expect(categorizeItem("chicken")).toBe("meat");
    expect(categorizeItem("ground beef")).toBe("meat");
    expect(categorizeItem("salmon")).toBe("meat");
    expect(categorizeItem("tofu")).toBe("meat");
    expect(categorizeItem("ham")).toBe("meat");
  });

  test("dairy", () => {
    expect(categorizeItem("butter")).toBe("dairy");
    expect(categorizeItem("eggs")).toBe("dairy");
    expect(categorizeItem("greek yogurt")).toBe("dairy");
    expect(categorizeItem("goat cheese")).toBe("dairy");
    expect(categorizeItem("mozzarella")).toBe("dairy");
  });

  test("pantry", () => {
    expect(categorizeItem("olive oil")).toBe("pantry");
    expect(categorizeItem("rice")).toBe("pantry");
    expect(categorizeItem("spaghetti")).toBe("pantry");
    expect(categorizeItem("chickpeas")).toBe("pantry");
    expect(categorizeItem("peanut butter")).toBe("pantry");
    expect(categorizeItem("honey")).toBe("pantry");
  });

  test("spices", () => {
    expect(categorizeItem("cumin")).toBe("spices");
    expect(categorizeItem("paprika")).toBe("spices");
    expect(categorizeItem("vanilla extract")).toBe("spices");
    expect(categorizeItem("garam masala")).toBe("spices");
  });

  test("bakery", () => {
    expect(categorizeItem("naan")).toBe("bakery");
    expect(categorizeItem("pita bread")).toBe("bakery");
    expect(categorizeItem("bagel")).toBe("bakery");
    expect(categorizeItem("tortilla")).toBe("bakery");
  });

  test("frozen", () => {
    expect(categorizeItem("frozen peas")).toBe("frozen");
    expect(categorizeItem("frozen corn")).toBe("frozen");
    expect(categorizeItem("ice cream")).toBe("frozen");
  });

  test("suffix heuristics catch unknown items", () => {
    expect(categorizeItem("boysenberry")).toBe("produce");
    expect(categorizeItem("smoked gouda cheese")).toBe("dairy");
    expect(categorizeItem("mango chutney sauce")).toBe("pantry");
    expect(categorizeItem("shawarma seasoning")).toBe("spices");
    expect(categorizeItem("potato bread")).toBe("bakery");
  });

  test("contains keyword heuristics", () => {
    expect(categorizeItem("frozen mango")).toBe("frozen");
    expect(categorizeItem("smoked chicken thigh")).toBe("meat");
  });

  test("no false positives from short keys", () => {
    // "pea" (3 chars) should not partial-match inside "peanut butter"
    expect(categorizeItem("peanut butter")).toBe("pantry");
  });

  test("chicken broth is pantry not meat (direct match wins)", () => {
    expect(categorizeItem("chicken broth")).toBe("pantry");
  });

  test("coconut milk is pantry", () => {
    expect(categorizeItem("coconut milk")).toBe("pantry");
  });

  test("unknown items return null", () => {
    expect(categorizeItem("xylophone")).toBeNull();
  });
});

// ─── formatUnit ─────────────────────────────────────────────────────────────

describe("formatUnit", () => {
  test("hides 'unit' type", () => {
    expect(formatUnit("unit", 1)).toBe("");
    expect(formatUnit("unit", 4)).toBe("");
    expect(formatUnit("", 1)).toBe("");
  });

  test("singular when qty ≤ 1", () => {
    expect(formatUnit("lb", 1)).toBe("lb");
    expect(formatUnit("can", 0.5)).toBe("can");
    expect(formatUnit("cup", 1)).toBe("cup");
  });

  test("pluralizes when qty > 1", () => {
    expect(formatUnit("lb", 2)).toBe("lbs");
    expect(formatUnit("can", 3)).toBe("cans");
    expect(formatUnit("clove", 4)).toBe("cloves");
    expect(formatUnit("cup", 2)).toBe("cups");
    expect(formatUnit("head", 2)).toBe("heads");
    expect(formatUnit("stalk", 4)).toBe("stalks");
    expect(formatUnit("whole", 3)).toBe("wholes");
    expect(formatUnit("slice", 6)).toBe("slices");
    expect(formatUnit("piece", 5)).toBe("pieces");
    expect(formatUnit("handful", 2)).toBe("handfuls");
  });

  test("abbreviations stay invariant", () => {
    expect(formatUnit("oz", 12)).toBe("oz");
    expect(formatUnit("tbsp", 3)).toBe("tbsp");
    expect(formatUnit("tsp", 2)).toBe("tsp");
    expect(formatUnit("g", 500)).toBe("g");
    expect(formatUnit("ml", 250)).toBe("ml");
  });

  test("irregular plurals", () => {
    expect(formatUnit("bunch", 2)).toBe("bunches");
    expect(formatUnit("pinch", 3)).toBe("pinches");
    expect(formatUnit("dash", 2)).toBe("dashes");
  });
});

// ─── formatDisplayQuantity ──────────────────────────────────────────────────

describe("formatDisplayQuantity", () => {
  test("integers display cleanly", () => {
    expect(formatDisplayQuantity(2)).toBe("2");
    expect(formatDisplayQuantity("3")).toBe("3");
    expect(formatDisplayQuantity(1.0)).toBe("1");
  });

  test("decimals round to 1 place", () => {
    expect(formatDisplayQuantity(1.333)).toBe("1.3");
    expect(formatDisplayQuantity(0.75)).toBe("0.8");
  });

  test("string input works", () => {
    expect(formatDisplayQuantity("2.5")).toBe("2.5");
    expect(formatDisplayQuantity("1")).toBe("1");
  });
});

// ─── formatItemQuantity ─────────────────────────────────────────────────────

describe("formatItemQuantity", () => {
  test("hides unit type completely", () => {
    expect(formatItemQuantity(4, "unit")).toBe("4");
    expect(formatItemQuantity(1, "unit")).toBe("1");
  });

  test("shows quantity + pluralized unit", () => {
    expect(formatItemQuantity(2, "lb")).toBe("2 lbs");
    expect(formatItemQuantity(3, "can")).toBe("3 cans");
    expect(formatItemQuantity(1, "cup")).toBe("1 cup");
  });

  test("works with string quantities", () => {
    expect(formatItemQuantity("2", "lb")).toBe("2 lbs");
    expect(formatItemQuantity("0.5", "cup")).toBe("0.5 cup");
  });
});
