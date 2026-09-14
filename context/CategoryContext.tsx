import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { storage } from '../storage/mmkv';
import { STORAGE_KEYS } from '../storage/keys';
import {
  CategoryDefinition,
  DEFAULT_SPENDING_CATEGORIES,
  updateCategoriesCache,
} from '../constants/categories';

export interface CategoryContextType {
  categories: CategoryDefinition[];
  allCategories: CategoryDefinition[];
  customCategories: CategoryDefinition[];
  defaultCategories: CategoryDefinition[];
  systemCategories?: CategoryDefinition[];
  deletedDefaultCategories: CategoryDefinition[];
  isLoaded: boolean;
  addCategory: (input: { name: string; icon: string; color: string; group?: string }) => boolean;
  updateCategory: (
    oldName: string,
    input: { name: string; icon: string; color: string; group?: string }
  ) => boolean;
  deleteCategory: (name: string) => void;
  restoreDefaultCategory: (name: string) => void;
  moveCategoryUp: (index: number) => void;
  moveCategoryDown: (index: number) => void;
  reorderCategories: (newOrder: CategoryDefinition[]) => void;
  resetToDefaults: (includeCustom?: boolean) => void;
  getCategoryIcon: (name: string) => string;
  getCategoryColor: (name: string) => string;
  getCategoryGroup: (name: string) => string;
  refresh: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | null>(null);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const rawCustomized = await storage.getString(STORAGE_KEYS.CATEGORIES_CUSTOMIZED);
      if (rawCustomized) {
        const parsed = JSON.parse(rawCustomized);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          updateCategoriesCache(parsed);
          setIsLoaded(true);
          return;
        }
      }

      // Check legacy custom categories
      const rawLegacy = await storage.getString(STORAGE_KEYS.CUSTOM_CATEGORIES);
      if (rawLegacy) {
        const parsedLegacy = JSON.parse(rawLegacy);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          const markedLegacy = parsedLegacy.map((c: any) => ({
            ...c,
            isCustom: true,
            id: c.id || ('custom_' + c.name.toLowerCase().replace(/\s+/g, '_')),
          }));
          const combined = [...markedLegacy, ...DEFAULT_SPENDING_CATEGORIES];
          setCategories(combined);
          updateCategoriesCache(combined);
          await storage.set(STORAGE_KEYS.CATEGORIES_CUSTOMIZED, JSON.stringify(combined));
          setIsLoaded(true);
          return;
        }
      }

      // Default fallback
      setCategories([...DEFAULT_SPENDING_CATEGORIES]);
      updateCategoriesCache([...DEFAULT_SPENDING_CATEGORIES]);
    } catch (err) {
      console.error('Error loading categories:', err);
      setCategories([...DEFAULT_SPENDING_CATEGORIES]);
      updateCategoriesCache([...DEFAULT_SPENDING_CATEGORIES]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const persistCategories = useCallback(async (list: CategoryDefinition[]) => {
    setCategories(list);
    updateCategoriesCache(list);
    try {
      await storage.set(STORAGE_KEYS.CATEGORIES_CUSTOMIZED, JSON.stringify(list));
      const customOnly = list.filter((c) => c.isCustom);
      await storage.set(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(customOnly));
    } catch (err) {
      console.error('Error saving categories:', err);
    }
  }, []);

  const customCategories = useMemo(() => {
    return categories.filter((c) => c.isCustom);
  }, [categories]);

  const defaultCategories = useMemo(() => {
    return categories.filter((c) => !c.isCustom);
  }, [categories]);

  const deletedDefaultCategories = useMemo(() => {
    return DEFAULT_SPENDING_CATEGORIES.filter(
      (def) => !categories.some((c) => c.name.toLowerCase().trim() === def.name.toLowerCase().trim())
    );
  }, [categories]);

  const addCategory = useCallback(
    (input: { name: string; icon: string; color: string; group?: string }) => {
      const trimmed = input.name.trim();
      if (!trimmed) return false;

      const exists = categories.some((c) => c.name.toLowerCase().trim() === trimmed.toLowerCase());
      if (exists) return false;

      const newCategory: CategoryDefinition = {
        id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: trimmed,
        icon: input.icon || 'shapes-outline',
        color: input.color || '#4FC3F7',
        group: input.group || 'General',
        isCustom: true,
      };

      const updated = [newCategory, ...categories];
      persistCategories(updated);
      return true;
    },
    [categories, persistCategories]
  );

  const updateCategory = useCallback(
    (
      oldName: string,
      input: { name: string; icon: string; color: string; group?: string }
    ) => {
      const trimmed = input.name.trim();
      if (!trimmed) return false;

      const targetIdx = categories.findIndex(
        (c) => c.name.toLowerCase().trim() === oldName.toLowerCase().trim()
      );
      if (targetIdx === -1) return false;

      if (trimmed.toLowerCase() !== oldName.toLowerCase().trim()) {
        const collision = categories.some(
          (c, idx) => idx !== targetIdx && c.name.toLowerCase().trim() === trimmed.toLowerCase()
        );
        if (collision) return false;
      }

      const existing = categories[targetIdx];
      const updatedItem: CategoryDefinition = {
        ...existing,
        name: trimmed,
        icon: input.icon || existing.icon,
        color: input.color || existing.color,
        group: input.group || existing.group,
      };

      const updated = [...categories];
      updated[targetIdx] = updatedItem;
      persistCategories(updated);
      return true;
    },
    [categories, persistCategories]
  );

  const deleteCategory = useCallback(
    (name: string) => {
      const target = name.toLowerCase().trim();
      const updated = categories.filter((c) => c.name.toLowerCase().trim() !== target);
      persistCategories(updated);
    },
    [categories, persistCategories]
  );

  const restoreDefaultCategory = useCallback(
    (name: string) => {
      const target = name.toLowerCase().trim();
      const defaultDef = DEFAULT_SPENDING_CATEGORIES.find(
        (c) => c.name.toLowerCase().trim() === target
      );
      if (!defaultDef) return;

      if (!categories.some((c) => c.name.toLowerCase().trim() === target)) {
        const updated = [...categories, { ...defaultDef }];
        persistCategories(updated);
      }
    },
    [categories, persistCategories]
  );

  const moveCategoryUp = useCallback(
    (index: number) => {
      if (index <= 0 || index >= categories.length) return;
      const updated = [...categories];
      const item = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = item;
      persistCategories(updated);
    },
    [categories, persistCategories]
  );

  const moveCategoryDown = useCallback(
    (index: number) => {
      if (index < 0 || index >= categories.length - 1) return;
      const updated = [...categories];
      const item = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = item;
      persistCategories(updated);
    },
    [categories, persistCategories]
  );

  const reorderCategories = useCallback(
    (newOrder: CategoryDefinition[]) => {
      if (Array.isArray(newOrder)) {
        persistCategories(newOrder);
      }
    },
    [persistCategories]
  );

  const resetToDefaults = useCallback(
    (includeCustom: boolean = false) => {
      if (includeCustom) {
        persistCategories([...DEFAULT_SPENDING_CATEGORIES]);
      } else {
        const customOnly = categories.filter((c) => c.isCustom);
        const restored = [...customOnly, ...DEFAULT_SPENDING_CATEGORIES];
        persistCategories(restored);
      }
    },
    [categories, persistCategories]
  );

  const getCategoryIcon = useCallback(
    (name: string): string => {
      const target = (name || '').toLowerCase().trim();
      const found = categories.find((c) => c.name.toLowerCase().trim() === target);
      if (found) return found.icon;
      const def = DEFAULT_SPENDING_CATEGORIES.find((c) => c.name.toLowerCase().trim() === target);
      return def ? def.icon : 'ellipse-outline';
    },
    [categories]
  );

  const getCategoryColor = useCallback(
    (name: string): string => {
      const target = (name || '').toLowerCase().trim();
      const found = categories.find((c) => c.name.toLowerCase().trim() === target);
      if (found) return found.color;
      const def = DEFAULT_SPENDING_CATEGORIES.find((c) => c.name.toLowerCase().trim() === target);
      return def ? def.color : '#4FC3F7';
    },
    [categories]
  );

  const getCategoryGroup = useCallback(
    (name: string): string => {
      const target = (name || '').toLowerCase().trim();
      const found = categories.find((c) => c.name.toLowerCase().trim() === target);
      if (found) return found.group || 'General';
      const def = DEFAULT_SPENDING_CATEGORIES.find((c) => c.name.toLowerCase().trim() === target);
      return def ? def.group : 'General';
    },
    [categories]
  );

  return (
    <CategoryContext.Provider
      value={{
        categories,
        allCategories: categories,
        customCategories,
        defaultCategories,
        systemCategories: defaultCategories,
        deletedDefaultCategories,
        isLoaded,
        addCategory,
        updateCategory,
        deleteCategory,
        restoreDefaultCategory,
        moveCategoryUp,
        moveCategoryDown,
        reorderCategories,
        resetToDefaults,
        getCategoryIcon,
        getCategoryColor,
        getCategoryGroup,
        refresh: loadCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategoryContext = () => {
  const ctx = useContext(CategoryContext);
  if (!ctx) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }
  return ctx;
};