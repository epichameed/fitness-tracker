import React, { useState } from 'react';
import { DayWorkout } from '../types';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';

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
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-primary" />
          7-Day Workout Plan
        </h2>

        <div className="tabs tabs-boxed mb-4">
          {workoutPlan.map((day, index) => (
            <button
              key={day.day}
              className={`tab ${selectedDay === index ? 'tab-active' : ''}`}
              onClick={() => setSelectedDay(index)}
            >
              {day.day}
            </button>
          ))}
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg">
              {workoutPlan[selectedDay].day} - {workoutPlan[selectedDay].focus}
            </h3>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Exercise</th>
                    <th>Sets</th>
                    <th>Reps</th>
                    <th>Rest</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {workoutPlan[selectedDay].exercises.map((exercise, index) => (
                    <motion.tr
                      key={exercise.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <td>{exercise.name}</td>
                      <td>{exercise.sets}</td>
                      <td>{exercise.reps}</td>
                      <td>{exercise.rest}s</td>
                      <td>{exercise.notes}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}