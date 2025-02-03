import React, { useState, useCallback } from "react";
import { MealPlan as TMealPlan, DayPlan, Meal } from "../types";
import { motion } from "framer-motion";
import { Clock, Utensils, Loader2 } from "lucide-react";

interface Props {
  mealPlan: TMealPlan;
  onPlanChange?: (
    plan: "affordable" | "premium",
    day: string
  ) => Promise<DayPlan>;
}

type MealTime = "breakfast" | "lunch" | "dinner" | "snacks";

export default function MealPlan({ mealPlan, onPlanChange }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<"affordable" | "premium">(
    "affordable"
  );
  const [selectedDay, setSelectedDay] = useState<string>("monday");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlanData, setCurrentPlanData] = useState(mealPlan);

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const handlePlanChange = useCallback(
    async (newPlan: "affordable" | "premium") => {
      if (newPlan === selectedPlan) return;
      setIsLoading(true);
      setSelectedPlan(newPlan);

      try {
        if (onPlanChange) {
          const dayPlan = await onPlanChange(newPlan, selectedDay);
          setCurrentPlanData((prev) => ({
            ...prev,
            [newPlan]: {
              ...prev[newPlan],
              [selectedDay]: dayPlan,
            },
          }));
        }
      } catch (error) {
        console.error("Failed to load plan:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedPlan, selectedDay, onPlanChange]
  );

  const handleDayChange = useCallback(
    async (newDay: string) => {
      if (newDay === selectedDay) return;
      setIsLoading(true);
      setSelectedDay(newDay);

      try {
        if (onPlanChange) {
          const dayPlan = await onPlanChange(selectedPlan, newDay);
          setCurrentPlanData((prev) => ({
            ...prev,
            [selectedPlan]: {
              ...prev[selectedPlan],
              [newDay]: dayPlan,
            },
          }));
        }
      } catch (error) {
        console.error("Failed to load day:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedPlan, selectedDay, onPlanChange]
  );

  // Add safety checks
  const currentPlan = currentPlanData?.[selectedPlan]?.[selectedDay] || {};
  const meals: Record<MealTime, Meal | Meal[]> = {
    breakfast: currentPlan.breakfast || ({} as Meal),
    lunch: currentPlan.lunch || ({} as Meal),
    dinner: currentPlan.dinner || ({} as Meal),
    snacks: Array.isArray(currentPlan.snacks) ? currentPlan.snacks : [],
  };

  const renderMealStats = (meal: Meal) => (
    <div className="stats stats-vertical lg:stats-horizontal shadow">
      <div className="stat">
        <div className="stat-title">Calories</div>
        <div className="stat-value text-primary">{meal?.calories || 0}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Protein</div>
        <div className="stat-value text-secondary">
          {meal?.macros?.protein || 0}g
        </div>
      </div>
      <div className="stat">
        <div className="stat-title">Carbs</div>
        <div className="stat-value text-accent">
          {meal?.macros?.carbs || 0}g
        </div>
      </div>
      <div className="stat">
        <div className="stat-title">Fats</div>
        <div className="stat-value">{meal?.macros?.fats || 0}g</div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-100 shadow-xl"
    >
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <Utensils className="w-6 h-6 text-primary" />
          7-Day Meal Plan
        </h2>

        <div className="flex gap-2 mb-4">
          <button
            className={`btn ${
              selectedPlan === "affordable" ? "btn-primary" : "btn-ghost"
            }`}
            onClick={() => handlePlanChange("affordable")}
            disabled={isLoading}
          >
            Affordable Plan
          </button>
          <button
            className={`btn ${
              selectedPlan === "premium" ? "btn-primary" : "btn-ghost"
            }`}
            onClick={() => handlePlanChange("premium")}
            disabled={isLoading}
          >
            Premium Plan
          </button>
        </div>

        <div className="tabs tabs-boxed mb-4">
          {days.map((day) => (
            <button
              key={day}
              className={`tab ${selectedDay === day ? "tab-active" : ""}`}
              onClick={() => handleDayChange(day)}
              disabled={isLoading}
            >
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(meals).map(([mealTime, meal]) => {
              if (mealTime === "snacks" && Array.isArray(meal)) {
                return meal.map((snack, index) => (
                  <motion.div
                    key={`${mealTime}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card bg-base-200"
                  >
                    <div className="card-body">
                      <h3 className="card-title text-lg">{`Snack ${
                        index + 1
                      }`}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{snack.time || "N/A"}</span>
                      </div>
                      <p className="font-medium">{snack.name || "N/A"}</p>
                      <p className="text-sm">{snack.recipe || "N/A"}</p>
                      {renderMealStats(snack)}
                    </div>
                  </motion.div>
                ));
              }

              if (!Array.isArray(meal)) {
                return (
                  <motion.div
                    key={mealTime}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card bg-base-200"
                  >
                    <div className="card-body">
                      <h3 className="card-title text-lg capitalize">
                        {mealTime}
                      </h3>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{meal.time || "N/A"}</span>
                      </div>
                      <p className="font-medium">{meal.name || "N/A"}</p>
                      <p className="text-sm">{meal.recipe || "N/A"}</p>
                      {renderMealStats(meal)}
                    </div>
                  </motion.div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
