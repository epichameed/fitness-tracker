import React from 'react';
import { MacroTarget } from '../types';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

interface Props {
  macroTargets: MacroTarget[];
}

export default function MacroTargets({ macroTargets }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-100 shadow-xl"
    >
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          Daily Macro Targets
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {macroTargets.map((macro, index) => (
            <motion.div
              key={macro.nutrient}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="stats shadow"
            >
              <div className="stat">
                <div className="stat-title">{macro.nutrient}</div>
                <div className="stat-value text-primary">{macro.amount}g</div>
                <div className="stat-desc">{macro.details}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}