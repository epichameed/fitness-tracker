import React, { useState } from "react";
import { DayWorkout } from "../types";
import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";

interface Props {
  workoutPlan: DayWorkout[];
}

export default function WorkoutPlan({ workoutPlan }: Props) {
  const [selectedDay, setSelectedDay] = useState<number>(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-100 shadow-xl"
    >
      <div className="card-body p-3 md:p-6">
        <h2 className="card-title flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-primary" />
          7-Day Workout Plan
        </h2>

        <div className="overflow-x-auto -mx-3 md:-mx-6 mb-4">
          <div className="tabs tabs-boxed flex-nowrap min-w-max p-3 md:p-6">
            {workoutPlan.map((day, index) => (
              <button
                key={day.day}
                className={`tab h-10 min-w-[5rem] text-xs md:text-sm font-medium ${
                  selectedDay === index ? "tab-active" : ""
                }`}
                onClick={() => setSelectedDay(index)}
              >
                {day.day}
              </button>
            ))}
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body p-4">
            <h3 className="card-title text-base md:text-lg capitalize">
              {workoutPlan[selectedDay].day} - {workoutPlan[selectedDay].focus}
            </h3>
            <div className="overflow-x-auto -mx-4">
              <div className="min-w-[600px] p-4">
                <table className="table w-full table-pin-rows">
                  <thead>
                    <tr className="text-xs md:text-sm">
                      <th className="bg-base-100">Exercise</th>
                      <th className="bg-base-100">Sets</th>
                      <th className="bg-base-100">Reps</th>
                      <th className="bg-base-100">Rest</th>
                      <th className="bg-base-100">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workoutPlan[selectedDay].exercises.map((exercise, index) => (
                      <motion.tr
                        key={`${exercise.name}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-xs md:text-sm hover:bg-base-100/50"
                      >
                        <td className="font-medium">{exercise.name}</td>
                        <td>{exercise.sets}</td>
                        <td>{exercise.reps}</td>
                        <td>{exercise.rest}s</td>
                        <td className="text-base-content/80">{exercise.notes}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
