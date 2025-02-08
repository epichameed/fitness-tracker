import React, { useState } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Activity, Target, Scale } from "lucide-react";
import PersonalDataForm from "./components/PersonalDataForm";
import MacroTargets from "./components/MacroTargets";
import MealPlan from "./components/MealPlan";
import GroceryList from "./components/GroceryList";
import WorkoutPlan from "./components/WorkoutPlan";
import { calculateHealthMetrics } from "./utils/calculations";
import {
  generateMacroTargets,
  generateMealPlans,
  generateGroceryList,
  generateWorkoutPlan,
} from "./utils/ai";
import {
  PersonalData,
  MacroTarget,
  MealPlan as TMealPlan,
  GroceryItem,
  DayWorkout,
} from "./types";

function App() {
  const [calculations, setCalculations] = useState(null);
  const [macroTargets, setMacroTargets] = useState<MacroTarget[] | null>(null);
  const [mealPlan, setMealPlan] = useState<TMealPlan | null>(null);
  const [groceryList, setGroceryList] = useState<GroceryItem[] | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<DayWorkout[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PersonalData) => {
    try {
      setLoading(true);
      setError(null);

      // Calculate basic metrics
      const metrics = calculateHealthMetrics(
        data.weight,
        data.height,
        data.age,
        data.gender,
        data.activityLevel,
        data.goal
      );
      setCalculations(metrics);

      // Generate AI-powered plans
      const macros = await generateMacroTargets(data, metrics.tdee);
      setMacroTargets(macros);

      const meals = await generateMealPlans(data, metrics.tdee, macros);
      setMealPlan(meals);

      const grocery = await generateGroceryList(meals, "affordable");
      setGroceryList(grocery);

      const workout = await generateWorkoutPlan(data);
      setWorkoutPlan(workout);
    } catch (err) {
      setError("Failed to generate your personalized plan. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Dumbbell className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-base-content mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Fitness & Nutrition Planner
          </h1>
          <p className="text-lg text-base-content/80">
            Your personalized journey to a healthier lifestyle starts here
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card bg-base-100 shadow-xl"
          >
            <div className="card-body">
              <h2 className="card-title text-2xl mb-6 flex items-center gap-2">
                <Scale className="w-6 h-6 text-primary" />
                Personal Information
              </h2>
              <PersonalDataForm onSubmit={handleSubmit} />
            </div>
          </motion.div>

          {loading && (
            <div className="text-center p-8">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="mt-4 text-lg">
                Generating your personalized fitness plan...
              </p>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {calculations && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card bg-base-100 shadow-xl"
              >
                <div className="card-body">
                  <h2 className="card-title text-2xl mb-6 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-primary" />
                    Your Health Metrics
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="stats shadow">
                      <div className="stat">
                        <div className="stat-title">BMI</div>
                        <div className="stat-value text-primary">
                          {calculations.bmi.value}
                        </div>
                        <div className="stat-desc">
                          {calculations.bmi.category}
                        </div>
                        <div className="mt-2 text-sm">
                          {calculations.bmi.message}
                        </div>
                      </div>
                    </div>

                    <div className="stats shadow">
                      <div className="stat">
                        <div className="stat-title">BMR</div>
                        <div className="stat-value text-secondary">
                          {calculations.bmr}
                        </div>
                        <div className="stat-desc">Calories/day at rest</div>
                      </div>
                    </div>

                    <div className="stats shadow">
                      <div className="stat">
                        <div className="stat-title">TDEE</div>
                        <div className="stat-value text-accent">
                          {calculations.tdee}
                        </div>
                        <div className="stat-desc">
                          Daily energy expenditure
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {macroTargets && <MacroTargets macroTargets={macroTargets} />}
              {mealPlan && <MealPlan mealPlan={mealPlan} />}
              {groceryList && <GroceryList groceryList={groceryList} />}
              {workoutPlan && <WorkoutPlan workoutPlan={workoutPlan} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
