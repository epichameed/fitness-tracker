import React, { useState } from "react";
import { DayWorkout } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Clock, Repeat, Timer } from "lucide-react";

interface Props {
  workoutPlan: DayWorkout[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

export default function WorkoutPlan({ workoutPlan }: Props) {
  const [selectedDay, setSelectedDay] = useState<number>(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-100 shadow-xl"
    >
      <div className="card-body p-4 md:p-6">
        <h2 className="card-title flex items-center gap-2 mb-4">
          <Dumbbell className="w-6 h-6 text-primary" />
          7-Day Workout Plan
        </h2>

        <div className="grid grid-cols-7 gap-2 mb-6">
          {workoutPlan.map((day, index) => (
            <button
              key={day.day}
              className={`btn btn-sm md:btn-md ${
                selectedDay === index
                  ? "btn-primary"
                  : "btn-ghost hover:btn-primary/20"
              }`}
              onClick={() => setSelectedDay(index)}
            >
              <span className="capitalize text-xs md:text-sm">{day.day.slice(0, 3)}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between gap-4 bg-base-200 p-4 rounded-box">
              <h3 className="font-medium text-base md:text-lg capitalize">
                {workoutPlan[selectedDay].day}
              </h3>
              <div className="badge badge-primary py-3">
                {workoutPlan[selectedDay].focus}
              </div>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-4"
            >
              {workoutPlan[selectedDay].exercises.map((exercise, index) => (
                <motion.div
                  key={`${exercise.name}-${index}`}
                  variants={itemVariants}
                  className="card bg-base-200 hover:shadow-md transition-shadow"
                >
                  <div className="card-body p-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Repeat className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm md:text-base">
                            {exercise.name}
                          </h4>
                          {exercise.notes && (
                            <p className="text-xs md:text-sm text-base-content/70 mt-1">
                              {exercise.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-base-100 rounded-lg p-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-xs text-base-content/70">Sets</p>
                            <p className="font-medium text-sm">{exercise.sets}</p>
                          </div>
                        </div>
                        <div className="bg-base-100 rounded-lg p-3 flex items-center gap-2">
                          <Repeat className="w-4 h-4 text-secondary" />
                          <div>
                            <p className="text-xs text-base-content/70">Reps</p>
                            <p className="font-medium text-sm">{exercise.reps}</p>
                          </div>
                        </div>
                        <div className="bg-base-100 rounded-lg p-3 flex items-center gap-2">
                          <Timer className="w-4 h-4 text-accent" />
                          <div>
                            <p className="text-xs text-base-content/70">Rest</p>
                            <p className="font-medium text-sm">{exercise.rest}s</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
