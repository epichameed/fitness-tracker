import React, { useState } from "react";
import { MealPlan as TMealPlan, DayPlan, Meal } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Utensils, Loader2 } from "lucide-react";

interface Props {
  mealPlan: TMealPlan;
}

type MealTime = "breakfast" | "lunch" | "dinner" | "snacks";

const springTransition = {
  type: "spring",
  stiffness: 200,
  damping: 20
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.9 },
  show: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: springTransition
  }
};

const hoverVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    y: -5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: { scale: 0.98 }
};

export default function MealPlan({ mealPlan }: Props) {
  const [selectedDay, setSelectedDay] = useState<string>("monday");
  const [isLoading, setIsLoading] = useState(false);

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const calculateDayTotals = () => {
    return Object.values(meals).flat().reduce((totals, meal) => {
      if (Array.isArray(meal)) return totals;
      return {
        calories: totals.calories + (meal?.calories || 0),
        protein: totals.protein + (meal?.macros?.protein || 0),
        carbs: totals.carbs + (meal?.macros?.carbs || 0),
        fats: totals.fats + (meal?.macros?.fats || 0)
      };
    }, {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    });
  };

  const handleDayChange = (newDay: string) => {
    if (newDay === selectedDay) return;
    setSelectedDay(newDay);
  };

  // Add safety checks
  const currentPlan = mealPlan?.affordable?.[selectedDay] || {};
  const meals: Record<MealTime, Meal | Meal[]> = {
    breakfast: currentPlan.breakfast || ({} as Meal),
    lunch: currentPlan.lunch || ({} as Meal),
    dinner: currentPlan.dinner || ({} as Meal),
    snacks: Array.isArray(currentPlan.snacks) ? currentPlan.snacks : [],
  };

  const renderMealStats = (meal: Meal) => (
    <motion.div 
      variants={itemVariants}
      className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4"
    >
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
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="card bg-base-100 shadow-xl mx-auto w-full"
    >
      <div className="card-body p-4 md:p-6">
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springTransition}
          className="card-title flex items-center gap-2 mb-4"
        >
          <Utensils className="w-6 h-6 text-primary" />
          7-Day Meal Plan
        </motion.h2>

        <div className="grid grid-cols-7 gap-2 mb-6">
          {days.map((day) => (
            <motion.button
              key={day}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              variants={hoverVariants}
              className={`btn btn-sm md:btn-md ${
                selectedDay === day
                  ? "btn-primary"
                  : "btn-ghost hover:btn-primary/20"
              }`}
              onClick={() => handleDayChange(day)}
              disabled={isLoading}
            >
              <span className="capitalize text-xs md:text-sm">{day.slice(0, 3)}</span>
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={springTransition}
            className="space-y-6"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springTransition}
              className="flex items-center justify-between gap-4 bg-base-200 p-4 rounded-box "
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-3">
                <h3 className="font-semibold text-lg md:text-xl capitalize mb-2 sm:mb-0 px-1">
                  {selectedDay}
                </h3>
                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-6 bg-primary/5 border border-primary/10 p-3 sm:px-4 sm:py-2 rounded-lg shadow-sm">
                   {Object.entries(calculateDayTotals()).map(([key, value]) => (
                     <div key={key} className="flex flex-col items-start sm:items-center sm:flex-row p-2 sm:p-0 bg-base-100/50 sm:bg-transparent rounded-md">
                       <span className="font-semibold text-base sm:text-sm whitespace-nowrap">
                         {value}{key === 'calories' ? '' : 'g'}
                       </span>
                       <span className={`text-xs sm:ml-1.5 whitespace-nowrap ${
                        key === 'calories' ? 'text-primary' :
                        key === 'protein' ? 'text-secondary' :
                        key === 'carbs' ? 'text-accent' :
                        'text-base-content/70'
                      }`}>
                        {key === 'calories' ? 'calories' : key}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-4"
              >
                {Object.entries(meals).map(([mealTime, meal]) => {
                  if (mealTime === "snacks" && Array.isArray(meal)) {
                    return meal.map((snack, index) => (
                      <motion.div
                        key={`${mealTime}-${index}`}
                        variants={itemVariants}
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
                        variants={itemVariants}
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
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
