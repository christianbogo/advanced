// src/filter/FilterContext.tsx

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
  Dispatch,
} from 'react';

// 1. Define the types of items that can be selected
export type SelectableItemType =
  | 'team'
  | 'season'
  | 'meet'
  | 'athlete'
  | 'person'
  | 'event'; // <<< UPDATED: Added 'event' type

// 2. Define the structure of the state
export interface FilterState {
  selected: {
    [key in SelectableItemType]: string[];
  };
  superSelected: {
    [key in SelectableItemType]: string[];
  };
}

// 3. Define the default initial state
const initialState: FilterState = {
  selected: {
    team: [],
    season: [],
    meet: [],
    athlete: [],
    person: [],
    event: [], // <<< UPDATED: Added event key
  },
  superSelected: {
    team: [],
    season: [],
    meet: [],
    athlete: [],
    person: [],
    event: [], // <<< UPDATED: Added event key
  },
};

// --- Persistence Logic ---
const FILTER_STORAGE_KEY = 'appFilterState-v1';

// Function to load state from localStorage
const loadStateFromStorage = (): FilterState => {
  try {
    const storedState = localStorage.getItem(FILTER_STORAGE_KEY);
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      // Basic validation and merging with initialState for robustness
      if (parsedState && parsedState.selected && parsedState.superSelected) {
        console.log(
          '[FilterContext] Loaded state from localStorage:',
          parsedState
        );
        // <<< UPDATED: Merge parsed state with initialState >>>
        // This ensures that if new types were added (like 'event'),
        // their keys exist in the loaded state, preventing errors.
        const mergedState: FilterState = {
          selected: {
            ...initialState.selected, // Start with defaults
            ...parsedState.selected, // Override with loaded values
          },
          superSelected: {
            ...initialState.superSelected, // Start with defaults
            ...parsedState.superSelected, // Override with loaded values
          },
        };
        // Optional: Clean up keys that are no longer in SelectableItemType (if needed)
        // Object.keys(mergedState.selected).forEach(key => { ... });
        return mergedState;
      } else {
        console.warn(
          '[FilterContext] Stored state structure mismatch or incomplete, using default.'
        );
      }
    } else {
      console.log(
        '[FilterContext] No state found in localStorage, using default.'
      );
    }
  } catch (error) {
    console.error(
      '[FilterContext] Error loading filter state from localStorage:',
      error
    );
  }
  // Return default state if nothing valid loaded or error occurred
  return initialState;
};
// --- End Persistence Logic ---

// 4. Define the actions for the reducer (No changes needed)
type FilterAction =
  | {
      type: 'TOGGLE_SELECTION';
      payload: { itemType: SelectableItemType; id: string };
    }
  | { type: 'CLEAR_SELECTED'; payload: { itemType: SelectableItemType } }
  | { type: 'CLEAR_SUPER_SELECTED'; payload: { itemType: SelectableItemType } }
  | { type: 'CLEAR_ALL_TYPE'; payload: { itemType: SelectableItemType } }
  | { type: 'CLEAR_ALL' };

// 5. Define the reducer function (No changes needed)
const filterReducer = (
  state: FilterState,
  action: FilterAction
): FilterState => {
  console.log(
    '[FilterContext] Reducer Action:',
    action.type,
    'Payload:',
    'payload' in action ? action.payload : 'N/A'
  );
  switch (action.type) {
    case 'TOGGLE_SELECTION': {
      const { itemType, id } = action.payload;
      // Ensure the arrays exist before accessing methods (belt-and-suspenders with loadStateFromStorage merge)
      const currentSelected = state.selected[itemType] || [];
      const currentSuperSelected = state.superSelected[itemType] || [];

      const isSuperSelected = currentSuperSelected.includes(id);
      const isSelected = currentSelected.includes(id);

      let nextSelected = [...currentSelected];
      let nextSuperSelected = [...currentSuperSelected];

      if (isSuperSelected) {
        // Demote from super-selected to unselected
        nextSelected = nextSelected.filter((itemId) => itemId !== id);
        nextSuperSelected = nextSuperSelected.filter((itemId) => itemId !== id);
      } else if (isSelected) {
        // Promote from selected to super-selected (keep in selected array)
        nextSuperSelected.push(id);
      } else {
        // Move from unselected to selected
        nextSelected.push(id);
      }

      return {
        ...state,
        selected: {
          ...state.selected,
          [itemType]: nextSelected,
        },
        superSelected: {
          ...state.superSelected,
          [itemType]: nextSuperSelected,
        },
      };
    }

    case 'CLEAR_SELECTED': {
      const { itemType } = action.payload;
      // Clearing selected should also clear super-selected for that type
      return {
        ...state,
        selected: {
          ...state.selected,
          [itemType]: [],
        },
        superSelected: {
          ...state.superSelected,
          [itemType]: [],
        },
      };
    }

    case 'CLEAR_SUPER_SELECTED': {
      const { itemType } = action.payload;
      // Clearing super-selected only clears that array
      return {
        ...state,
        superSelected: {
          ...state.superSelected,
          [itemType]: [],
        },
      };
    }

    case 'CLEAR_ALL_TYPE': {
      const { itemType } = action.payload;
      // Clearing all for a type clears both selected and super-selected
      return {
        ...state,
        selected: {
          ...state.selected,
          [itemType]: [],
        },
        superSelected: {
          ...state.superSelected,
          [itemType]: [],
        },
      };
    }

    case 'CLEAR_ALL': {
      localStorage.removeItem(FILTER_STORAGE_KEY);
      console.log(
        '[FilterContext] Cleared all filters and removed from localStorage.'
      );
      // Return a fresh copy of the initialState structure
      return {
        selected: { ...initialState.selected },
        superSelected: { ...initialState.superSelected },
      };
    }

    default:
      // const exhaustiveCheck: never = action; // Optional exhaustive check
      return state;
  }
};

// 6. Define the shape of the context value (No changes needed)
interface FilterContextProps {
  state: FilterState;
  dispatch: Dispatch<FilterAction>;
  toggleSelection: (itemType: SelectableItemType, id: string) => void;
  clearSelected: (itemType: SelectableItemType) => void;
  clearSuperSelected: (itemType: SelectableItemType) => void;
  clearAllByType: (itemType: SelectableItemType) => void;
  clearAll: () => void;
}

// 7. Create the context (No changes needed)
const FilterContext = createContext<FilterContextProps | undefined>(undefined);

// 8. Create the Provider component (No changes needed to the component logic itself)
interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  // Initialize state using the enhanced load function
  const [state, dispatch] = useReducer(
    filterReducer,
    initialState, // Pass initial state structure for reference
    loadStateFromStorage // Initializer function
  );

  // useEffect to save state changes to localStorage (No changes needed)
  useEffect(() => {
    try {
      const stateToSave = JSON.stringify(state);
      localStorage.setItem(FILTER_STORAGE_KEY, stateToSave);
      // console.log('[FilterContext] Saved state to localStorage:', state); // Can be noisy
    } catch (error) {
      console.error(
        '[FilterContext] Error saving filter state to localStorage:',
        error
      );
    }
  }, [state]);

  // Memoized action functions (Definitions folded for brevity, no changes needed)
  const toggleSelection = useCallback(
    (itemType: SelectableItemType, id: string) => {
      dispatch({ type: 'TOGGLE_SELECTION', payload: { itemType, id } });
    },
    []
  );
  const clearSelected = useCallback((itemType: SelectableItemType) => {
    dispatch({ type: 'CLEAR_SELECTED', payload: { itemType } });
  }, []);
  const clearSuperSelected = useCallback((itemType: SelectableItemType) => {
    dispatch({ type: 'CLEAR_SUPER_SELECTED', payload: { itemType } });
  }, []);
  const clearAllByType = useCallback((itemType: SelectableItemType) => {
    dispatch({ type: 'CLEAR_ALL_TYPE', payload: { itemType } });
  }, []);
  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  // Context value (Definition folded for brevity, no changes needed)
  const value = React.useMemo(
    () => ({
      state,
      dispatch,
      toggleSelection,
      clearSelected,
      clearSuperSelected,
      clearAllByType,
      clearAll,
    }),
    [
      state,
      toggleSelection,
      clearSelected,
      clearSuperSelected,
      clearAllByType,
      clearAll,
    ]
  ); // Include stable callbacks in dependency array

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
};

// 9. Create the custom hook (No changes needed)
export const useFilterContext = (): FilterContextProps => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};
