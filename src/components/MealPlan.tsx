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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
      <div className="stat bg-base-100 rounded-lg p-2 md:p-4">
        <div className="stat-title text-sm md:text-base">Calories</div>
        <div className="stat-value text-primary text-lg md:text-2xl">
          {meal?.calories || 0}
        </div>
      </div>
      <div className="stat bg-base-100 rounded-lg p-2 md:p-4">
        <div className="stat-title text-sm md:text-base">Protein</div>
        <div className="stat-value text-secondary text-lg md:text-2xl">
          {meal?.macros?.protein || 0}g
        </div>
      </div>
      <div className="stat bg-base-100 rounded-lg p-2 md:p-4">
        <div className="stat-title text-sm md:text-base">Carbs</div>
        <div className="stat-value text-accent text-lg md:text-2xl">
          {meal?.macros?.carbs || 0}g
        </div>
      </div>
      <div className="stat bg-base-100 rounded-lg p-2 md:p-4">
        <div className="stat-title text-sm md:text-base">Fats</div>
        <div className="stat-value text-lg md:text-2xl">
          {meal?.macros?.fats || 0}g
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-100 shadow-xl mx-auto w-full"
    >
      <div className="card-body p-4 md:p-6">
        <h2 className="card-title flex items-center gap-2">
          <Utensils className="w-6 h-6 text-primary" />
          7-Day Meal Plan
        </h2>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`btn btn-sm md:btn-md ${
              selectedPlan === "affordable" ? "btn-primary" : "btn-ghost"
            }`}
            onClick={() => handlePlanChange("affordable")}
            disabled={isLoading}
          >
            Affordable Plan
          </button>
          <button
            className={`btn btn-sm md:btn-md ${
              selectedPlan === "premium" ? "btn-primary" : "btn-ghost"
            }`}
            onClick={() => handlePlanChange("premium")}
            disabled={isLoading}
          >
            Premium Plan
          </button>
        </div>

        <div className="tabs tabs-boxed mb-4 overflow-x-auto flex-nowrap w-full">
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
                    className="card bg-base-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="card-body p-3 md:p-6">
                      <h3 className="card-title text-base md:text-lg">{`Snack ${
                        index + 1
                      }`}</h3>
                      <div className="flex items-center gap-1.5 text-xs md:text-sm text-base-content/70">
                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span>{snack.time || "N/A"}</span>
                      </div>
                      <p className="font-medium text-sm md:text-base mt-2">
                        {snack.name || "N/A"}
                      </p>
                      <p className="text-xs md:text-sm text-base-content/80">
                        {snack.recipe || "N/A"}
                      </p>
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
                    className="card bg-base-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="card-body p-3 md:p-6">
                      <h3 className="card-title text-base md:text-lg capitalize">
                        {mealTime}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs md:text-sm text-base-content/70">
                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span>{meal.time || "N/A"}</span>
                      </div>
                      <p className="font-medium text-sm md:text-base mt-2">
                        {meal.name || "N/A"}
                      </p>
                      <p className="text-xs md:text-sm text-base-content/80">
                        {meal.recipe || "N/A"}
                      </p>
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
