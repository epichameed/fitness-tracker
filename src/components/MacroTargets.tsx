import React from "react";
import { MacroTarget } from "../types";
import { motion } from "framer-motion";
import { Target, Leaf, Flame, GaugeCircle } from "lucide-react";

interface Props {
  macroTargets: MacroTarget[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const getIconAndColor = (nutrient: string): { icon: JSX.Element; color: string } => {
  switch (nutrient.toLowerCase()) {
    case "protein":
      return {
        icon: <Leaf className="w-5 h-5" />,
        color: "text-success",
      };
    case "carbs":
      return {
        icon: <Flame className="w-5 h-5" />,
        color: "text-error",
      };
    case "fat":
      return {
        icon: <GaugeCircle className="w-5 h-5" />,
        color: "text-warning",
      };
    default:
      return {
        icon: <Target className="w-5 h-5" />,
        color: "text-primary",
      };
  }
};

export default function MacroTargets({ macroTargets }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-100 shadow-xl"
    >
      <div className="card-body p-6">
        <h2 className="card-title flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="w-6 h-6 text-primary" />
          </div>
          Daily Macro Targets
        </h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {macroTargets.map((macro, index) => {
            const { icon, color } = getIconAndColor(macro.nutrient);
            return (
              <motion.div
                key={macro.nutrient}
                variants={cardVariants}
                className="card bg-base-200 hover:shadow-md transition-all duration-300"
              >
                <div className="card-body p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-lg bg-base-100 ${color}`}>
                      {icon}
                    </div>
                    <h3 className={`font-semibold text-sm uppercase ${color}`}>
                      {macro.nutrient}
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`text-2xl font-bold ${color}`}
                    >
                      {macro.amount}
                    </motion.span>
                    <span className="text-sm text-base-content/70">grams</span>
                  </div>

                  <p className="text-xs text-base-content/70 line-clamp-2">
                    {macro.details}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
