import { PriceSource } from '../types';

const mockWebsites = [
  { name: 'Daraz.pk', baseUrl: 'https://www.daraz.pk' },
  { name: 'AliExpress.pk', baseUrl: 'https://www.aliexpress.pk' },
  { name: 'OLX Pakistan', baseUrl: 'https://www.olx.com.pk' },
  { name: 'Telemart', baseUrl: 'https://www.telemart.pk' },
];

const generateRandomPrice = (basePrice: number): number => {
  // Generate a random price within ±20% of the base price
  const variation = basePrice * 0.2;
  return basePrice + (Math.random() * variation * 2 - variation);
};

// This is a mock implementation. In a real app, you would:
// 1. Set up proper web scraping with necessary permissions
// 2. Implement rate limiting and caching
// 3. Handle errors gracefully
// 4. Use actual data from the websites
export const fetchPriceComparisons = async (
  item: string,
  basePrice: number
): Promise<PriceSource[]> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock price data from different sources
    return mockWebsites.map(website => {
      const price = generateRandomPrice(basePrice);
      const searchQuery = encodeURIComponent(`${item} price in pakistan`);
      
      return {
        website: website.name,
        price: Math.round(price), // Round to whole numbers
        url: `${website.baseUrl}/search?q=${searchQuery}`,
        lastUpdated: new Date().toLocaleDateString('en-PK', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      };
    });
  } catch (error) {
    console.error('Error fetching price comparisons:', error);
    throw error;
  }
};

// Function to analyze price variations
export const analyzePrices = (sources: PriceSource[], currentPrice: number) => {
  const prices = sources.map(s => s.price);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  return {
    averagePrice: Math.round(avgPrice),
    minPrice: Math.round(minPrice),
    maxPrice: Math.round(maxPrice),
    priceRange: Math.round(priceRange),
    isCurrentPriceCompetitive: currentPrice <= avgPrice,
    potentialSavings: Math.max(0, Math.round(currentPrice - minPrice)),
  };
};