import { useState, useCallback, useEffect } from 'react';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import { SPENDING_CATEGORIES, CategoryDefinition } from '../constants/categories';

export const useCategoryManager = () => {
  const [customCategories, setCustomCategories] = useState<CategoryDefinition[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const raw = await storage.getString(STORAGE_KEYS.CUSTOM_CATEGORIES);
      if (raw) {
        setCustomCategories(JSON.parse(raw));
      } else {
        setCustomCategories([]);
      }
    } catch {
      setCustomCategories([]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const saveCustomCategories = useCallback((list: CategoryDefinition[]) => {
    storage.set(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(list));
    setCustomCategories(list);
  }, []);

  const addCategory = useCallback(
    (input: { name: string; icon: string; color: string; group?: string }) => {
      const name = input.name.trim();
      if (!name) return false;

      // Check if already exists in system or custom
      const existsInSystem = SPENDING_CATEGORIES.some(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );
      const existsInCustom = customCategories.some(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );

      if (existsInSystem || existsInCustom) return false;

      const newCategory: CategoryDefinition = {
        name,
        icon: input.icon || 'ellipse-outline',
        color: input.color || '#4FC3F7',
        group: input.group || 'General',
      };

      const updated = [newCategory, ...customCategories];
      saveCustomCategories(updated);
      return true;
    },
    [customCategories, saveCustomCategories]
  );

  const deleteCategory = useCallback(
    (name: string) => {
      const updated = customCategories.filter(
        (c) => c.name.toLowerCase() !== name.toLowerCase()
      );
      saveCustomCategories(updated);
    },
    [customCategories, saveCustomCategories]
  );

  const allCategories: CategoryDefinition[] = [
    ...customCategories,
    ...SPENDING_CATEGORIES,
  ];

  const getCategoryIcon = useCallback(
    (catName: string) => {
      const found = allCategories.find(
        (c) => c.name.toLowerCase() === (catName || '').toLowerCase()
      );
      return found ? found.icon : 'ellipse-outline';
    },
    [allCategories]
  );

  const getCategoryColor = useCallback(
    (catName: string) => {
      const found = allCategories.find(
        (c) => c.name.toLowerCase() === (catName || '').toLowerCase()
      );
      return found ? found.color : '#4FC3F7';
    },
    [allCategories]
  );

  return {
    allCategories,
    customCategories,
    systemCategories: SPENDING_CATEGORIES,
    isLoaded,
    addCategory,
    deleteCategory,
    getCategoryIcon,
    getCategoryColor,
    refresh: loadCategories,
  };
};
