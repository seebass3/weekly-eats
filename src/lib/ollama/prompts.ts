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

export const SYSTEM_PROMPT = `You are a practical home cooking assistant. You generate weeknight dinner recipes that are:
- Ready in under 45 minutes total (prep + cook)
- Serve 2 people
- Use commonly available ingredients
- Clear, precise measurements using decimal numbers (e.g. 0.5, not 1/2)

Always respond with valid JSON matching the exact schema requested. Do not include any text outside the JSON object.`;

export function buildRecipePrompt(options: {
  dayIndex: number;
  previousRecipes: string[];
  recentWeeksRecipes: string[];
  favoriteNames: string[];
}): string {
  const { dayIndex, previousRecipes, recentWeeksRecipes, favoriteNames } =
    options;
  const day = DAYS[dayIndex];
  const season = MONTH_SEASONS[new Date().getMonth()];

  let prompt = `Generate a dinner recipe for ${day} night. It is currently ${season}, so favor seasonal ingredients where appropriate.`;

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
  "servings": 2,
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
