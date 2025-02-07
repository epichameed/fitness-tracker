import React from 'react';
import { GroceryItem } from '../types';
import { motion } from 'framer-motion';
import { ShoppingCart, Package2, DollarSign } from 'lucide-react';

interface Props {
  groceryList: GroceryItem[];
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
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function GroceryList({ groceryList }: Props) {
  const total = groceryList.reduce((sum, item) => sum + item.price, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-100 shadow-xl"
    >
      <div className="card-body p-4 md:p-6">
        <h2 className="card-title flex items-center gap-2 mb-4">
          <ShoppingCart className="w-6 h-6 text-primary" />
          Weekly Grocery List
        </h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4"
        >
          {groceryList.map((item, index) => (
            <motion.div
              key={item.item}
              variants={itemVariants}
              className="card bg-base-200 hover:shadow-md transition-shadow"
            >
              <div className="card-body p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Package2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm md:text-base">{item.item}</h3>
                      <p className="text-xs md:text-sm text-base-content/70">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-grow">
                      {item.notes && (
                        <span className="text-xs md:text-sm text-base-content/70 block">
                          {item.notes}
                        </span>
                      )}
                    </div>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="badge badge-primary py-3 whitespace-nowrap"
                    >
                      {item.price} PKR
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-primary text-primary-content mt-6"
        >
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <span className="font-medium">Total Amount</span>
              </div>
              <div className="text-lg font-semibold">
                {total} PKR
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}