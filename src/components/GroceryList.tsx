import React, { useState, useEffect } from 'react';
import { GroceryItem, PriceComparison } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Package2, DollarSign, Search, X, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { fetchPriceComparisons, analyzePrices } from '../utils/price-service';

interface Props {
  groceryList: GroceryItem[];
}

interface PricePanelProps {
  isOpen: boolean;
  onClose: () => void;
  groceryList: GroceryItem[];
}

const PricePanel: React.FC<PricePanelProps> = ({ isOpen, onClose, groceryList }) => {
  const [itemPrices, setItemPrices] = useState<Record<string, PriceComparison>>({});

  const fetchPriceData = async (item: GroceryItem) => {
    if (itemPrices[item.item]?.alternativePrices?.length > 0) return; // Already fetched

    setItemPrices(prev => ({
      ...prev,
      [item.item]: { ...prev[item.item], loading: true }
    }));

    try {
      const prices = await fetchPriceComparisons(item.item, item.price);
      const analysis = analyzePrices(prices, item.price);

      setItemPrices(prev => ({
        ...prev,
        [item.item]: {
          currentPrice: item.price,
          alternativePrices: prices,
          loading: false,
          analysis
        }
      }));
    } catch (error) {
      setItemPrices(prev => ({
        ...prev,
        [item.item]: {
          currentPrice: item.price,
          alternativePrices: [],
          loading: false,
          error: 'Failed to fetch price data'
        }
      }));
    }
  };

  // Load initial price data when panel opens
  useEffect(() => {
    if (isOpen) {
      groceryList.forEach(item => fetchPriceData(item));
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 h-full w-full md:w-96 bg-base-100 shadow-xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Price Verification</h3>
                <button onClick={onClose} className="btn btn-ghost btn-sm btn-square">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-6">
                {groceryList.map((item) => (
                  <div key={item.item} className="card bg-base-200">
                    <div className="card-body p-4">
                      <h4 className="font-medium flex items-center justify-between">
                        {item.item}
                        <span className="text-sm text-base-content/70">
                          {item.quantity} {item.unit}
                        </span>
                      </h4>

                      {itemPrices[item.item]?.loading ? (
                        <div className="mt-4 flex justify-center">
                          <span className="loading loading-spinner loading-md text-primary"></span>
                        </div>
                      ) : itemPrices[item.item]?.error ? (
                        <div className="alert alert-error mt-4">
                          <p className="text-sm">{itemPrices[item.item].error}</p>
                        </div>
                      ) : (
                        <>
                          <div className="mt-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">Your Price:</p>
                              <div className="badge badge-primary">{item.price} PKR</div>
                            </div>

                            {itemPrices[item.item]?.analysis && (
                              <div className="grid gap-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-base-content/70">Market Average:</span>
                                  <span className="font-medium">
                                    {itemPrices[item.item]?.analysis?.averagePrice} PKR
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-base-content/70">Price Range:</span>
                                  <span className="font-medium">
                                    {itemPrices[item.item]?.analysis?.minPrice} - {itemPrices[item.item]?.analysis?.maxPrice} PKR
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  {itemPrices[item.item]?.analysis?.isCurrentPriceCompetitive ? (
                                    <div className="flex items-center gap-2 text-success">
                                      <TrendingDown className="w-4 h-4" />
                                      <span>Your price is competitive!</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-warning">
                                      <TrendingUp className="w-4 h-4" />
                                      <span>Potential savings: {itemPrices[item.item]?.analysis?.potentialSavings} PKR</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="divider text-xs text-base-content/50">Available Prices</div>

                            <div className="space-y-3">
                              {itemPrices[item.item]?.alternativePrices.map((source, idx) => (
                                <a
                                  key={idx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{source.website}</span>
                                    <span className="text-xs text-base-content/70">
                                      Updated: {source.lastUpdated}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{source.price} PKR</span>
                                    <ArrowRight className="w-4 h-4 text-base-content/50" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

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
  const [showPricePanel, setShowPricePanel] = useState(false);
  const total = groceryList.reduce((sum, item) => sum + item.price, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-100 shadow-xl"
    >
      <div className="card-body p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Weekly Grocery List
          </h2>
          <button
            onClick={() => setShowPricePanel(true)}
            className="btn btn-primary btn-sm gap-2"
          >
            <Search className="w-4 h-4" />
            Verify Prices
          </button>
        </div>

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
                  <div className="flex items-center justify-between gap-4">
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
      <PricePanel
        isOpen={showPricePanel}
        onClose={() => setShowPricePanel(false)}
        groceryList={groceryList}
      />
    </motion.div>
  );
}