const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

const MONTH_SEASONS: Record<number, string> = {
  0: "winter",
  1: "winter",
  2: "early spring",
  3: "spring",
  4: "late spring",
  5: "summer",
  6: "summer",
  7: "late summer",
  8: "early fall",
  9: "fall",
  10: "late fall",
  11: "winter",
};

// Days 0,2 (Mon, Wed) are vegetarian; days 1,3,4 (Tue, Thu, Fri) include meat
const VEGETARIAN_DAYS = new Set([0, 2]);

export const SYSTEM_PROMPT = `You are a practical home cooking assistant. You generate weeknight dinner recipes that are:
- Weeknight-friendly (typically 20-45 minutes total)
- Serve 4 people (generous portions for leftovers)
- Use commonly available ingredients
- Clear, precise measurements using decimal numbers (e.g. 0.5, not 1/2)

Vary the prep and cook times realistically based on the dish. A stir-fry might be 10 min prep + 12 min cook, a braise might be 15 min prep + 35 min cook, a salad bowl might be 15 min prep + 0 min cook.

Always respond with valid JSON matching the exact schema requested. Do not include any text outside the JSON object.`;

export function buildWeekPlanPrompt(options: {
  recentWeeksRecipes: string[];
  favoriteNames: string[];
  context?: string;
}): string {
  const { recentWeeksRecipes, favoriteNames, context } = options;
  const season = MONTH_SEASONS[new Date().getMonth()];

  let prompt = `Generate 5 weeknight dinner recipes for Monday through Friday. It is currently ${season}, so favor seasonal ingredients where appropriate.

IMPORTANT diet rules:
- Recipe 1 (Monday): MUST be VEGETARIAN — absolutely NO meat, chicken, fish, seafood, or poultry. Use plant proteins, eggs, cheese, or dairy instead.
- Recipe 2 (Tuesday): MUST include meat, poultry, or fish.
- Recipe 3 (Wednesday): MUST be VEGETARIAN — absolutely NO meat, chicken, fish, seafood, or poultry. Use plant proteins, eggs, cheese, or dairy instead.
- Recipe 4 (Thursday): MUST include meat, poultry, or fish.
- Recipe 5 (Friday): MUST include meat, poultry, or fish.

Each recipe must be unique — different cuisines, proteins, and cooking styles. Include variety (e.g. Italian, Mexican, Asian, American, Mediterranean, Indian).`;

  if (context) {
    prompt += `\n\nAdditional context from the household: "${context}"`;
  }

  if (recentWeeksRecipes.length > 0) {
    prompt += `\n\nRecipes from recent weeks (do NOT repeat):\n${recentWeeksRecipes.map((r) => `- ${r}`).join("\n")}`;
  }

  if (favoriteNames.length > 0) {
    const picked =
      favoriteNames[Math.floor(Math.random() * favoriteNames.length)];
    prompt += `\n\nThe household has a favorite recipe called "${picked}". You may include a variation of it if it fits well this week, but it is not required.`;
  }

  prompt += `\n\nRespond with a JSON object containing a "recipes" array of exactly 5 recipe objects in order (Monday first, Friday last):
{
  "recipes": [
    {
      "name": "string",
      "cuisine": "string",
      "cook_time_minutes": number,
      "prep_time_minutes": number,
      "servings": 4,
      "description": "string - one sentence",
      "ingredients": [{ "item": "string", "quantity": number, "unit": "string" }],
      "steps": ["step 1", "step 2"],
      "tags": ["tag1", "tag2"]
    }
  ]
}`;

  return prompt;
}

export function buildRecipePrompt(options: {
  dayIndex: number;
  previousRecipes: string[];
  recentWeeksRecipes: string[];
  favoriteNames: string[];
  context?: string;
}): string {
  const {
    dayIndex,
    previousRecipes,
    recentWeeksRecipes,
    favoriteNames,
    context,
  } = options;
  const day = DAYS[dayIndex];
  const season = MONTH_SEASONS[new Date().getMonth()];
  const isVegetarian = VEGETARIAN_DAYS.has(dayIndex);

  let prompt = `Generate a ${isVegetarian ? "vegetarian" : "dinner"} recipe for ${day} night. It is currently ${season}, so favor seasonal ingredients where appropriate.`;

  if (isVegetarian) {
    prompt += `\n\nThis MUST be a vegetarian recipe — no meat, poultry, or fish. Eggs and dairy are fine.`;
  } else {
    prompt += `\n\nThis should include meat, poultry, or fish as a main protein.`;
  }

  if (context) {
    prompt += `\n\nAdditional context from the household: "${context}"`;
  }

  if (previousRecipes.length > 0) {
    prompt += `\n\nRecipes already planned this week (do NOT repeat these or use very similar dishes):\n${previousRecipes.map((r) => `- ${r}`).join("\n")}`;
  }

  if (recentWeeksRecipes.length > 0) {
    prompt += `\n\nRecipes from recent weeks (avoid repeating):\n${recentWeeksRecipes.map((r) => `- ${r}`).join("\n")}`;
  }

  if (favoriteNames.length > 0) {
    const picked =
      favoriteNames[Math.floor(Math.random() * favoriteNames.length)];
    prompt += `\n\nThe household has a favorite recipe called "${picked}". You may include a variation of it if it fits well this week, but it is not required.`;
  }

  prompt += `\n\nInclude variety in cuisine type (e.g. Italian, Mexican, Asian, American, Mediterranean, Indian).

Respond with a JSON object matching this exact schema:
{
  "name": "string - the recipe name",
  "cuisine": "string - cuisine type",
  "cook_time_minutes": number,
  "prep_time_minutes": number,
  "servings": 4,
  "description": "string - one sentence description",
  "ingredients": [
    { "item": "string", "quantity": number, "unit": "string" }
  ],
  "steps": ["string - step 1", "string - step 2", ...],
  "tags": ["string - tag1", "string - tag2"]
}`;

  return prompt;
}

export function buildSingleRecipePrompt(options: {
  dayIndex: number;
  otherRecipes: string[];
  recentWeeksRecipes: string[];
  favoriteNames: string[];
  context?: string;
}): string {
  const {
    dayIndex,
    otherRecipes,
    recentWeeksRecipes,
    favoriteNames,
    context,
  } = options;
  const day = DAYS[dayIndex];
  const season = MONTH_SEASONS[new Date().getMonth()];
  const isVegetarian = VEGETARIAN_DAYS.has(dayIndex);

  let prompt = `Generate a replacement ${isVegetarian ? "vegetarian" : "dinner"} recipe for ${day} night. It is currently ${season}, so favor seasonal ingredients where appropriate.`;

  if (isVegetarian) {
    prompt += `\n\nThis MUST be a vegetarian recipe — no meat, poultry, or fish. Eggs and dairy are fine.`;
  } else {
    prompt += `\n\nThis should include meat, poultry, or fish as a main protein.`;
  }

  if (context) {
    prompt += `\n\nAdditional context from the household: "${context}"`;
  }

  if (otherRecipes.length > 0) {
    prompt += `\n\nOther recipes already planned this week (do NOT repeat these or use very similar dishes):\n${otherRecipes.map((r) => `- ${r}`).join("\n")}`;
  }

  if (recentWeeksRecipes.length > 0) {
    prompt += `\n\nRecipes from recent weeks (avoid repeating):\n${recentWeeksRecipes.map((r) => `- ${r}`).join("\n")}`;
  }

  if (favoriteNames.length > 0) {
    const picked =
      favoriteNames[Math.floor(Math.random() * favoriteNames.length)];
    prompt += `\n\nThe household has a favorite recipe called "${picked}". You may include a variation of it if it fits well this week, but it is not required.`;
  }

  prompt += `\n\nInclude variety in cuisine type (e.g. Italian, Mexican, Asian, American, Mediterranean, Indian).

Respond with a JSON object matching this exact schema:
{
  "name": "string - the recipe name",
  "cuisine": "string - cuisine type",
  "cook_time_minutes": number,
  "prep_time_minutes": number,
  "servings": 4,
  "description": "string - one sentence description",
  "ingredients": [
    { "item": "string", "quantity": number, "unit": "string" }
  ],
  "steps": ["string - step 1", "string - step 2", ...],
  "tags": ["string - tag1", "string - tag2"]
}`;

  return prompt;
}

export function buildGroceryCategoryPrompt(
  uncategorizedItems: string[]
): string {
  return `Categorize each of these grocery items into exactly one category.

Items:
${uncategorizedItems.map((item) => `- ${item}`).join("\n")}

Categories: produce, meat, dairy, pantry, spices, frozen, bakery, other

Respond with a JSON object where keys are the item names and values are the category:
{
  "item name": "category",
  ...
}`;
}
