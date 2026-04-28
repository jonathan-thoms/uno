import { useState, useEffect, useMemo } from 'react';
import { listenToMenuItems } from '../lib/sessionService';

/**
 * useMenu — Real-time hook for available menu items.
 * Groups items by category.
 *
 * Returns { categories, itemsByCategory, allItems, loading }
 */
export default function useMenu() {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToMenuItems((items) => {
      setAllItems(items);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Derive categories and grouped items
  const { categories, itemsByCategory } = useMemo(() => {
    const catMap = {};
    allItems.forEach((item) => {
      const cat = item.category || 'Uncategorized';
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push(item);
    });

    const sortedCategories = Object.keys(catMap).sort();

    return {
      categories: sortedCategories,
      itemsByCategory: catMap,
    };
  }, [allItems]);

  return { categories, itemsByCategory, allItems, loading };
}
