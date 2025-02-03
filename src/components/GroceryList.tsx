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
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-primary" />
          Weekly Grocery List
        </h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price (PKR)</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {groceryList.map((item, index) => (
                <motion.tr
                  key={item.item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td>{item.item}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>{item.price}</td>
                  <td>{item.notes}</td>
                </motion.tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
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
    </motion.div>
  );
}