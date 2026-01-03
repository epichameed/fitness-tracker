import { aiClient } from "./ai-client";
import {
  PersonalData,
  MacroTarget,
  MealPlan,
  GroceryItem,
  DayWorkout,
  DayPlan,
} from "../types";

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

function createEmptyMeal() {
  return {
    name: "",
    time: "",
    recipe: "",
    calories: 0,
    macros: {
      protein: 0,
      carbs: 0,
      fats: 0,
    },
  };
}

function validateResponse(
  data: any,
  type: "meal" | "macro" | "grocery" | "workout" | "dayPlan"
): boolean {
  const validateMeal = (meal: any) => {
    return (
      meal &&
      typeof meal.name === "string" &&
      typeof meal.time === "string" &&
      typeof meal.recipe === "string" &&
      typeof meal.calories === "number" &&
      meal.macros &&
      typeof meal.macros.protein === "number" &&
      typeof meal.macros.carbs === "number" &&
      typeof meal.macros.fats === "number"
    );
  };

  try {
    switch (type) {
      case "meal":
        // Check for any valid day in the meal plan (for chunked generation)
        if (!data?.mealPlan?.affordable) return false;
        const days = Object.keys(data.mealPlan.affordable);
        if (days.length === 0) return false;
        
        // Find the first day with a breakfast to validate
        const firstDay = days[0];
        const sampleMeal = data.mealPlan.affordable[firstDay]?.breakfast;
        if (!sampleMeal) return false;
        
        return (
          typeof sampleMeal.name === "string" &&
          typeof sampleMeal.time === "string" &&
          typeof sampleMeal.recipe === "string" &&
          typeof sampleMeal.calories === "number" &&
          typeof sampleMeal.macros?.protein === "number"
        );

      case "macro":
        if (!Array.isArray(data?.macroTargets)) return false;
        return data.macroTargets.every(
          (macro: any) =>
            typeof macro.nutrient === "string" &&
            typeof macro.amount === "number" &&
            typeof macro.details === "string"
        );

      case "grocery":
        if (!Array.isArray(data?.groceryList)) return false;
        return (
          data.groceryList.length > 0 &&
          data.groceryList.every(
            (item: any) =>
              typeof item.item === "string" &&
              typeof item.quantity === "number" &&
              typeof item.unit === "string" &&
              typeof item.price === "number"
          )
        );
      case "workout":
        if (!Array.isArray(data?.workoutPlan)) return false;
        return (
          data.workoutPlan.length > 0 &&
          data.workoutPlan.every(
            (day: any) =>
              typeof day.day === "string" &&
              typeof day.focus === "string" &&
              Array.isArray(day.exercises)
          )
        );

      case "dayPlan":
        if (!data?.dayPlan) return false;
        const plan = data.dayPlan;

        // Add default values for missing properties
        plan.breakfast = plan.breakfast || createEmptyMeal();
        plan.lunch = plan.lunch || createEmptyMeal();
        plan.dinner = plan.dinner || createEmptyMeal();
        plan.snacks = Array.isArray(plan.snacks) ? plan.snacks : [];

        // Validate that at least one meal exists and is valid
        const hasValidMeal =
          validateMeal(plan.breakfast) ||
          validateMeal(plan.lunch) ||
          validateMeal(plan.dinner) ||
          (plan.snacks.length > 0 &&
            plan.snacks.every((snack: any) => validateMeal(snack)));

        return hasValidMeal;

      default:
        return false;
        return false;
    }
  } catch {
    return false;
  }
}

function cleanMealPlanJson(content: string): string {
  // First clean up basic syntax
  let cleaned = content
    .replace(/{{/g, "{")
    .replace(/}}/g, "}")
    .replace(/}\s*,?\s*{/g, "}, {")
    .replace(/\[\s*{/g, "[{")
    .replace(/}\s*\]/g, "}]")
    .replace(/}}}}/g, "}}") // Fix multiple closing braces
    .replace(/(\d+)g/g, "$1") // Remove 'g' from numeric values
    .trim();

  // Fix snacks array syntax
  const snacksRegex = /"snacks"\s*:\s*\[([\s\S]*?)\]/g;
  cleaned = cleaned.replace(snacksRegex, (match, snacksContent) => {
    // Count opening and closing braces to ensure proper nesting
    const openBraces = (snacksContent.match(/{/g) || []).length;
    const closeBraces = (snacksContent.match(/}/g) || []).length;

    // Add missing closing braces
    if (openBraces > closeBraces) {
      snacksContent += "}".repeat(openBraces - closeBraces);
    }

    // Split items and clean each one
    const items = snacksContent.split(/},\s*{/);
    const cleanedItems = items.map((item: string) => {
      let cleaned = item.trim();
      if (!cleaned.startsWith("{")) cleaned = "{" + cleaned;
      if (!cleaned.endsWith("}")) cleaned = cleaned + "}";
      return cleaned;
    });

    return `"snacks": [${cleanedItems.join(", ")}]`;
  });

  // Fix empty objects
  cleaned = cleaned.replace(/{\s*}/g, '{"empty": true}');

  return cleaned;
}

function cleanNumericValue(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, "");
    return Number(cleaned) || 0;
  }
  return 0;
}

async function makeAIRequest(
  prompt: string,
  type: "meal" | "macro" | "grocery" | "workout" | "dayPlan",
  retryCount = 0
): Promise<any> {
  try {
    const isGemini = import.meta.env.VITE_AI_PROVIDER === "gemini";
    const model = isGemini ? "gemini-pro" : import.meta.env.VITE_AI_MODEL;

    const basePrompt = `You are a fitness and nutrition expert. Provide your response as a valid JSON object.

${prompt}

Important: 
1. Return ONLY the JSON object
2. No additional text or comments
3. No markdown code blocks
4. No URLs or special characters
5. Ensure all JSON is properly formatted
6. Use simple text for all string values
7. Always close all arrays and objects properly
8. Include commas between all array elements and object properties`;

    const options = {
      model,
      prompt: isGemini ? basePrompt : `[INST] ${basePrompt} [/INST]`,
      max_tokens: 8192,
      temperature: 0.7,
      ...(isGemini
        ? {}
        : {
            top_p: 0.7,
            top_k: 50,
            repetition_penalty: 1,
          }),
    };

    try {
      const response = await aiClient.complete(options);

      if (!response.output.text) {
        throw new Error("No response from AI");
      }

      console.log(
        `Attempt ${retryCount + 1} - Raw AI Response:`,
        response.output.text
      );

      // Clean and parse the response
      let cleanedContent = response.output.text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .replace(/\/\/.*/g, "") // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
        .replace(/Note:[\s\S]*$/, "") // Remove any "Note:" section
        .replace(/https?:\/\/\S+/g, "") // Remove URLs
        .replace(/\.\.\./g, "") // Remove ellipsis
        .replace(/[^\x20-\x7E\n]/g, "") // Remove non-printable characters
        .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();

      // Try to extract JSON if there's text before or after
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }

      // Apply specific cleaning based on the response type
      if (cleanedContent.includes('"mealPlan"')) {
        cleanedContent = cleanMealPlanJson(cleanedContent);
      } else if (cleanedContent.includes('"dayPlan"')) {
        const dayPlanMatch = cleanedContent.match(/"dayPlan"\s*:\s*{([^}]+)}}/);
        if (dayPlanMatch) {
          const partialContent = dayPlanMatch[1];
          // Check if we have a complete meal object
          if (partialContent.includes('"macros"')) {
            // Extract the complete meal and create a valid dayPlan structure
            const mealMatch = partialContent.match(
              /("breakfast"|"lunch"|"dinner")\s*:\s*({[^}]+})/
            );
            if (mealMatch) {
              const [, mealType, mealContent] = mealMatch;
              cleanedContent = `{
                "dayPlan": {
                  ${mealType}: ${mealContent},
                  "lunch": ${JSON.stringify(createEmptyMeal())},
                  "dinner": ${JSON.stringify(createEmptyMeal())},
                  "snacks": []
                }
              }`.replace(/\s+/g, " ");
            }
          }
        }
      }

      // Apply regular JSON cleaning
      cleanedContent = cleanedContent
        .replace(/}(\s*){/g, "}, {")
        .replace(/](\s*)\[/g, "], [")
        .replace(/}(\s*)"/, '}, "')
        .replace(/,(\s*[}\]])/g, "$1")
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
        .replace(/\[\s*{+\s*{/g, "[{")
        .replace(/}\s*}+\s*\]/g, "}]")
        .replace(/{{/g, "{")
        .replace(/}}/g, "}")
        .replace(/}\s+{/g, "}, {");

      // Check for and fix incomplete JSON arrays/objects
      const openBraces = (cleanedContent.match(/\{/g) || []).length;
      const closeBraces = (cleanedContent.match(/\}/g) || []).length;
      const openBrackets = (cleanedContent.match(/\[/g) || []).length;
      const closeBrackets = (cleanedContent.match(/\]/g) || []).length;

      // Add missing closing braces/brackets
      if (openBraces > closeBraces) {
        cleanedContent += "}".repeat(openBraces - closeBraces);
      }
      if (openBrackets > closeBrackets) {
        cleanedContent += "]".repeat(openBrackets - closeBrackets);
      }

      // Ensure arrays and objects are properly nested
      if (cleanedContent.includes('"macroTargets":')) {
        const macroMatch = cleanedContent.match(
          /"macroTargets"\s*:\s*\[([\s\S]*?)\]/
        );
        if (macroMatch) {
          // Clean up the macros array content
          let macrosContent = macroMatch[1]
            .replace(/{{/g, "{")
            .replace(/}}/g, "}")
            .replace(/}\s*,?\s*{/g, "}, {")
            .trim();

          // Ensure the array starts and ends properly
          if (!macrosContent.startsWith("{"))
            macrosContent = "{" + macrosContent;
          if (!macrosContent.endsWith("}")) macrosContent = macrosContent + "}";

          // Split into individual macro objects and clean each one
          const macros = macrosContent
            .split(/},\s*{/)
            .map((macro) => macro.replace(/^{/, "").replace(/}$/, "").trim())
            .filter(Boolean)
            .map((macro) => `{${macro}}`);

          // Replace the entire macroTargets array with cleaned version
          cleanedContent = cleanedContent.replace(
            /"macroTargets"\s*:\s*\[([\s\S]*?)\]/,
            `"macroTargets": [${macros.join(", ")}]`
          );
        }
      }

      try {
        const parsed = JSON.parse(cleanedContent);

        // Validate the response based on type
        if (!validateResponse(parsed, type)) {
          throw new Error(`Invalid ${type} response structure`);
        }

        // Validate and clean grocery list if present
        if (parsed.groceryList) {
          parsed.groceryList = parsed.groceryList
            .filter((item: any) => item && typeof item === "object")
            .map((item: any) => ({
              item: String(item.item || ""),
              quantity: Number(item.quantity) || 0,
              unit: String(item.unit || "unit"),
              price: Number(item.price) || 0,
              notes: String(item.notes || ""),
            }));
        }

        // Clean meal plan or day plan
        const cleanPlan = (plan: any) => {
          if (!plan || typeof plan !== "object") return plan;

          // Clean meals
          ["breakfast", "lunch", "dinner"].forEach((mealType) => {
            if (plan[mealType]) {
              plan[mealType] = {
                name: String(plan[mealType]?.name || ""),
                time: String(plan[mealType]?.time || ""),
                recipe: String(plan[mealType]?.recipe || ""),
                calories: cleanNumericValue(plan[mealType]?.calories),
                macros: {
                  protein: cleanNumericValue(plan[mealType]?.macros?.protein),
                  carbs: cleanNumericValue(plan[mealType]?.macros?.carbs),
                  fats: cleanNumericValue(plan[mealType]?.macros?.fats),
                },
              };
            }
          });

          // Clean snacks array
          if (plan.snacks) {
            plan.snacks = Array.isArray(plan.snacks)
              ? plan.snacks.map((snack: any) => ({
                  name: String(snack?.name || ""),
                  time: String(snack?.time || ""),
                  recipe: String(snack?.recipe || ""),
                  calories: cleanNumericValue(snack?.calories),
                  macros: {
                    protein: cleanNumericValue(snack?.macros?.protein),
                    carbs: cleanNumericValue(snack?.macros?.carbs),
                    fats: cleanNumericValue(snack?.macros?.fats),
                  },
                }))
              : [];
          }

          return plan;
        };

        // Process meal plan if present
        if (parsed.mealPlan) {
          Object.keys(parsed.mealPlan).forEach((planType) => {
            Object.keys(parsed.mealPlan[planType]).forEach((day) => {
              parsed.mealPlan[planType][day] = cleanPlan(
                parsed.mealPlan[planType][day]
              );
            });
          });
        }

        // Process day plan if present
        if (parsed.dayPlan) {
          parsed.dayPlan = cleanPlan(parsed.dayPlan);
        }

        return parsed;
      } catch (e) {
        console.error(`Attempt ${retryCount + 1} - JSON Parse Error:`, e);
        console.error("Cleaned Content:", cleanedContent);

        // Retry logic
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          return makeAIRequest(prompt, type, retryCount + 1);
        }

        throw new Error(
          `Could not parse JSON from response after ${MAX_RETRIES} attempts`
        );
      }
    } catch (error) {
      console.error(`Attempt ${retryCount + 1} - API Error:`, error);
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return makeAIRequest(prompt, type, retryCount + 1);
      }
      throw error;
    }
  } catch (error) {
    throw new Error(
      `Failed to process AI response after ${MAX_RETRIES} attempts`
    );
  }
}

export async function generateMacroTargets(
  personalData: PersonalData,
  tdee: number
): Promise<MacroTarget[]> {
  const prompt = `Generate macro targets based on these parameters:
    {
      "weight": ${personalData.weight},
      "goal": "${personalData.goal}",
      "tdee": ${tdee}
    }

    Return a JSON object with this structure:
    {
      "macroTargets": [
        {
          "nutrient": "protein",
          "amount": number,
          "details": "string"
        },
        // repeat for carbs and fats
      ]
    }`;

  const result = await makeAIRequest(prompt, "macro");
  return result.macroTargets || [];
}

export async function generateMealPlans(
  personalData: PersonalData,
  tdee: number,
  macroTargets: MacroTarget[]
): Promise<MealPlan> {
  // Generate meal plan in two batches to avoid response truncation
  const days1 = ["monday", "tuesday", "wednesday", "thursday"];
  const days2 = ["friday", "saturday", "sunday"];

  const generateBatch = async (days: string[]) => {
    // Calculate per-meal macro targets (4 meals: breakfast, lunch, dinner, snack)
    const proteinTarget = macroTargets.find(m => m.nutrient === "protein")?.amount || 150;
    const carbsTarget = macroTargets.find(m => m.nutrient === "carbohydrates")?.amount || 200;
    const fatsTarget = macroTargets.find(m => m.nutrient === "fats")?.amount || 60;
    
    // Distribute macros: 25% breakfast, 35% lunch, 30% dinner, 10% snack
    const mealDistribution = {
      breakfast: { protein: Math.round(proteinTarget * 0.25), carbs: Math.round(carbsTarget * 0.25), fats: Math.round(fatsTarget * 0.25) },
      lunch: { protein: Math.round(proteinTarget * 0.35), carbs: Math.round(carbsTarget * 0.35), fats: Math.round(fatsTarget * 0.35) },
      dinner: { protein: Math.round(proteinTarget * 0.30), carbs: Math.round(carbsTarget * 0.30), fats: Math.round(fatsTarget * 0.30) },
      snack: { protein: Math.round(proteinTarget * 0.10), carbs: Math.round(carbsTarget * 0.10), fats: Math.round(fatsTarget * 0.10) }
    };

    const prompt = `You are a Pakistani FITNESS COACH. Generate a PRECISE macro-matched meal plan for: ${days.join(", ")}
    
    STRICT DAILY TARGETS (MUST BE MET EXACTLY):
    - Total Calories: ${tdee} kcal
    - Total Protein: ${proteinTarget}g (THIS IS CRITICAL - DO NOT GO BELOW)
    - Total Carbs: ${carbsTarget}g
    - Total Fats: ${fatsTarget}g
    - Goal: ${personalData.goal}

    PER-MEAL MACRO TARGETS (follow these closely):
    - Breakfast: ${mealDistribution.breakfast.protein}g protein, ${mealDistribution.breakfast.carbs}g carbs, ${mealDistribution.breakfast.fats}g fats
    - Lunch: ${mealDistribution.lunch.protein}g protein, ${mealDistribution.lunch.carbs}g carbs, ${mealDistribution.lunch.fats}g fats  
    - Dinner: ${mealDistribution.dinner.protein}g protein, ${mealDistribution.dinner.carbs}g carbs, ${mealDistribution.dinner.fats}g fats
    - Snack: ${mealDistribution.snack.protein}g protein, ${mealDistribution.snack.carbs}g carbs, ${mealDistribution.snack.fats}g fats

    Return a JSON object with this EXACT structure:
    {
      "mealPlan": {
        "affordable": {
          "${days[0]}": {
            "breakfast": {
              "name": "Fitness meal name",
              "time": "HH:MM",
              "recipe": "Detailed ingredients with quantities",
              "calories": number,
              "macros": { "protein": ${mealDistribution.breakfast.protein}, "carbs": ${mealDistribution.breakfast.carbs}, "fats": ${mealDistribution.breakfast.fats} }
            },
            "lunch": { same structure with lunch macros },
            "dinner": { same structure with dinner macros },
            "snack": { same structure with snack macros }
          }
        }
      }
    }

    HIGH PROTEIN FOOD PORTIONS TO HIT TARGETS:
    - 200g chicken breast = 62g protein
    - 4 whole eggs = 24g protein
    - 6 egg whites = 22g protein  
    - 200g fish/salmon = 40g protein
    - 200g lean beef = 52g protein
    - 100g paneer = 18g protein
    - 1 cup daal = 18g protein
    - 200g Greek yogurt = 20g protein

    FITNESS MEAL REQUIREMENTS:
    1. GRILLED/BAKED/BOILED proteins - NO frying
    2. Use large protein portions to hit ${proteinTarget}g daily protein
    3. Carbs: Brown rice, oats, whole wheat chapati, sweet potato
    4. RECIPE FORMAT: "200g grilled chicken breast, 1.5 cups brown rice, 100g steamed broccoli, 1 tsp olive oil"
    
    CRITICAL:
    - Include ONLY these days: ${days.join(", ")}
    - Each day's meals MUST add up to: ${proteinTarget}g protein, ${carbsTarget}g carbs, ${fatsTarget}g fats
    - All numeric values without units
    - Return ONLY valid JSON, no markdown`;

    return makeAIRequest(prompt, "meal");
  };

  // Generate both batches
  const [batch1, batch2] = await Promise.all([
    generateBatch(days1),
    generateBatch(days2)
  ]);

  // Merge the meal plans
  const mergedPlan: MealPlan = {
    affordable: {
      ...batch1.mealPlan?.affordable,
      ...batch2.mealPlan?.affordable
    },
    premium: {
      ...batch1.mealPlan?.affordable, // Use affordable as premium for now
      ...batch2.mealPlan?.affordable
    }
  };

  // Validate we have all days
  const allDays = [...days1, ...days2];
  for (const day of allDays) {
    if (!mergedPlan.affordable[day]) {
      console.warn(`Missing day in meal plan: ${day}`);
    }
  }

  return mergedPlan;
}

export async function generateGroceryList(
  mealPlan: MealPlan,
  planType: "affordable" | "premium"
): Promise<GroceryItem[]> {
  const prompt = `Generate a complete grocery list for this weekly meal plan:
    ${JSON.stringify(mealPlan[planType])}
    
    Return a JSON object with this EXACT structure:
    {
      "groceryList": [
        {
          "item": "string",
          "quantity": number,
          "unit": "string",
          "price": number,
          "notes": "string"
        }
      ]
    }

    Important:
    1. Every item MUST have all fields (item, quantity, unit, price, notes)
    2. Include ALL ingredients needed for the entire week
    3. Use Pakistani market prices in PKR
    4. Consolidate duplicate ingredients and sum their quantities
    5. Return ONLY valid JSON - no additional text or comments
    6. Ensure the JSON is complete and properly closed`;

  const result = await makeAIRequest(prompt, "grocery");
  if (!result.groceryList || !Array.isArray(result.groceryList)) {
    throw new Error("Invalid grocery list response format");
  }

  // Filter and validate grocery items
  const groceryList = result.groceryList
    .filter(
      (item: any) =>
        item &&
        typeof item === "object" &&
        typeof item.item === "string" &&
        typeof item.quantity === "number" &&
        typeof item.unit === "string" &&
        typeof item.price === "number"
    )
    .map((item: GroceryItem) => ({
      item: item.item.trim(),
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      notes: item.notes || ""
    }));

  return groceryList;
}

export async function generateWorkoutPlan(
  personalData: PersonalData
): Promise<DayWorkout[]> {
  const prompt = `Generate a workout plan for:
    {
      "goal": "${personalData.goal}",
      "weight": ${personalData.weight}
    }

    Return a JSON object with this structure:
    {
      "workoutPlan": [
        {
          "day": "string",
          "focus": "string",
          "exercises": [
            {
              "name": "string",
              "sets": number,
              "reps": number,
              "rest": number,
              "notes": "string"
            }
          ]
        }
      ]
    }`;

  const result = await makeAIRequest(prompt, "workout");
  if (!result.workoutPlan) {
    throw new Error("Invalid workout plan response format");
  }
  return result.workoutPlan;
}

export async function generateDayPlan(
  personalData: PersonalData,
  tdee: number,
  macroTargets: MacroTarget[],
  planType: "affordable" | "premium",
  day: string
): Promise<DayPlan> {
  const prompt = `You are a Pakistani FITNESS COACH and bodybuilder nutritionist. Generate a CLEAN EATING meal plan for ${day}.
    
    User Profile:
    - Daily Calories: ${tdee} kcal
    - Goal: ${personalData.goal}
    - Plan Type: ${planType}
    - Target Macros: ${JSON.stringify(macroTargets)}

    Return a JSON object with this structure:
    {
      "dayPlan": {
        "breakfast": {
          "name": "Fitness meal name",
          "time": "HH:MM",
          "recipe": "Detailed ingredients with quantities",
          "calories": number,
          "macros": { "protein": number, "carbs": number, "fats": number }
        },
        "lunch": { same structure },
        "dinner": { same structure },
        "snacks": [{ same structure }]
      }
    }

    FITNESS MEAL REQUIREMENTS:
    1. GRILLED/BAKED/BOILED proteins - NO frying, minimal oil (1 tsp max)
    2. Prefer: Grilled chicken breast, egg whites, grilled fish, lean beef
    3. Carbs: Brown rice, oats, whole wheat chapati, sweet potato
    4. Fats: Olive oil, almonds, walnuts, peanut butter
    5. AVOID: Heavy curries, fried foods, ghee, white rice
    6. ${planType === "premium" ? "Premium: Use olive oil, salmon, quinoa, grass-fed beef" : "Budget: Use regular chicken, eggs, brown rice, local fish"}
    
    RECIPE FORMAT: "150g grilled chicken, 1 cup brown rice, 100g steamed veggies, 1 tsp olive oil"
    
    CRITICAL:
    - HIGH PROTEIN in every meal (30-50g)
    - All numeric values without units
    - Return ONLY valid JSON`;

  const result = await makeAIRequest(prompt, "dayPlan");
  if (!result.dayPlan) {
    throw new Error("Invalid day plan response format");
  }
  return result.dayPlan;
}
