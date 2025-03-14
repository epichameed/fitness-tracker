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
        if (!data?.mealPlan?.affordable?.monday?.breakfast) return false;
        const sampleMeal = data.mealPlan.affordable.monday.breakfast;
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
      max_tokens: 4000,
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
  const prompt = `Generate a complete 7-day Pakistani meal plan with these parameters:
    {
      "calories": ${tdee},
      "goal": "${personalData.goal}",
      "macros": ${JSON.stringify(macroTargets)}
    }

    Return a JSON object with this structure for ALL days and BOTH plan types:
    {
      "mealPlan": {
        "affordable": {
          "monday": {
            "breakfast": {
              "name": "string (name of dish)",
              "time": "HH:MM format",
              "recipe": "Brief cooking instructions without URLs or special characters",
              "calories": number (without units),
              "macros": {
                "protein": number (without units),
                "carbs": number (without units),
                "fats": number (without units)
              }
            }
          }
        }
      }
    }

    Important:
    1. Do not use "same as" or "same structure as" - provide complete objects
    2. Fill in all days (monday through sunday) for both affordable and premium plans
    3. Keep recipe instructions brief and simple
    4. Use real Pakistani recipes
    5. Ensure all meals add up to daily calorie target
    6. Do not add units (g, mg, etc.) to numeric values
    7. Return only valid JSON with complete objects`;

  const result = await makeAIRequest(prompt, "meal");
  if (!result.mealPlan) {
    throw new Error("Invalid meal plan response format");
  }
  return result.mealPlan;
}

export async function generateGroceryList(
  mealPlan: MealPlan,
  planType: "affordable" | "premium"
): Promise<GroceryItem[]> {
  const prompt = `Generate a grocery list for this meal plan and include search queries for price verification:
    ${JSON.stringify(mealPlan[planType])}
    
    For each grocery item, add a search query in [SEARCH:query] format to verify current local market prices.
    Example: For "chicken breast", add [SEARCH:chicken breast price per kg pakistan]
    
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
    2. Include a [SEARCH:query] before each grocery item for price verification
    3. Make search queries specific to Pakistani market prices
    4. Format all items consistently`;

  const response = await aiClient.complete({
    model: import.meta.env.VITE_AI_PROVIDER === "gemini" ? "gemini-pro" : import.meta.env.VITE_AI_MODEL,
    prompt,
    max_tokens: 4000,
    temperature: 0.7,
  });

  const result = await makeAIRequest(prompt, "grocery");
  if (!result.groceryList || !Array.isArray(result.groceryList)) {
    throw new Error("Invalid grocery list response format");
  }

  // Extract search queries from the response text
  const searchQueries = response.output.text
    .match(/\[SEARCH:(.*?)\]/g)
    ?.map(query => query.replace(/\[SEARCH:(.*?)\]/, '$1').trim()) || [];

  // Match search queries with grocery items
  const groceryList = result.groceryList
    .filter(
      (item: any) =>
        item &&
        typeof item === "object" &&
        typeof item.item === "string" &&
        typeof item.quantity === "number" &&
        typeof item.unit === "string" &&
        typeof item.price === "number" &&
        typeof item.notes === "string"
    )
    .map((item: GroceryItem, index: number) => ({
      ...item,
      priceSearchQuery: searchQueries[index] || `${item.item} price per ${item.unit} pakistan`
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
  const prompt = `Generate a single day Pakistani meal plan with these parameters:
    {
      "calories": ${tdee},
      "goal": "${personalData.goal}",
      "planType": "${planType}",
      "day": "${day}",
      "macros": ${JSON.stringify(macroTargets)}
    }

    Return a JSON object with this structure:
    {
      "dayPlan": {
        "breakfast": {
          "name": "string (name of dish)",
          "time": "HH:MM format",
          "recipe": "Brief cooking instructions without URLs or special characters",
          "calories": number,
          "macros": {
            "protein": number,
            "carbs": number,
            "fats": number
          }
        },
        "lunch": { SAME STRUCTURE AS BREAKFAST },
        "dinner": { SAME STRUCTURE AS BREAKFAST },
        "snacks": [{ SAME STRUCTURE AS BREAKFAST }]
      }
    }

    Important:
    1. Keep recipe instructions brief and simple
    2. Use real Pakistani recipes
    3. Ensure all meals add up to daily calorie target
    4. For premium plan, include higher quality ingredients and more variety
    5. Return only valid JSON with complete objects`;

  const result = await makeAIRequest(prompt, "dayPlan");
  if (!result.dayPlan) {
    throw new Error("Invalid day plan response format");
  }
  return result.dayPlan;
}
