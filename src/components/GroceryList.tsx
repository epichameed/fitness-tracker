import React from 'react';
import { GroceryItem } from '../types';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

interface Props {
  groceryList: GroceryItem[];
}

export default function GroceryList({ groceryList }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-100 shadow-xl"
    >
      <div className="card-body p-3 md:p-6">
        <h2 className="card-title flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-primary" />
          Weekly Grocery List
        </h2>
        <div className="overflow-x-auto -mx-3 md:-mx-6">
          <div className="min-w-[600px] p-3 md:p-6">
            <table className="table table-zebra w-full table-pin-rows">
              <thead>
                <tr className="text-xs md:text-sm">
                  <th className="bg-base-200">Item</th>
                  <th className="bg-base-200">Quantity</th>
                  <th className="bg-base-200">Price (PKR)</th>
                  <th className="bg-base-200">Notes</th>
                </tr>
              </thead>
              <tbody className="text-xs md:text-sm">
                {groceryList.map((item, index) => (
                  <motion.tr
                    key={item.item}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-base-200/50"
                  >
                    <td className="font-medium">{item.item}</td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>{item.price}</td>
                    <td className="text-base-content/80">{item.notes}</td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="text-sm md:text-base font-medium bg-base-200">
                  <th colSpan={2}>Total</th>
                  <th>
                    {groceryList.reduce((sum, item) => sum + item.price, 0)} PKR
                  </th>
                  <th></th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}