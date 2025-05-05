import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect, // Import useEffect
  ReactNode,
  Dispatch,
} from 'react';

// 1. Define the types of items that can be selected
export type SelectableItemType =
  | 'team'
  | 'season'
  | 'meet'
  | 'athlete'
  | 'person';

// 2. Define the structure of the state
export interface FilterState {
  selected: {
    [key in SelectableItemType]: string[]; // Array of selected IDs for each type
  };
  superSelected: {
    [key in SelectableItemType]: string[]; // Array of superSelected IDs for each type
  };
}

// 3. Define the default initial state (used if nothing in storage)
const initialState: FilterState = {
  selected: {
    team: [],
    season: [],
    meet: [],
    athlete: [],
    person: [],
  },
  superSelected: {
    team: [],
    season: [],
    meet: [],
    athlete: [],
    person: [],
  },
};

// --- Persistence Logic ---
const FILTER_STORAGE_KEY = 'appFilterState-v1'; // Unique key for localStorage

// Function to load state from localStorage
const loadStateFromStorage = (): FilterState => {
  try {
    const storedState = localStorage.getItem(FILTER_STORAGE_KEY);
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      // Basic validation: Check if essential keys exist
      if (parsedState.selected && parsedState.superSelected) {
        console.log(
          '[FilterContext] Loaded state from localStorage:',
          parsedState
        );
        return parsedState;
      } else {
        console.warn(
          '[FilterContext] Stored state structure mismatch, using default.'
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
  // Return default state if nothing loaded or error occurred
  return initialState;
};
// --- End Persistence Logic ---

// 4. Define the actions for the reducer
type FilterAction =
  | {
      type: 'TOGGLE_SELECTION';
      payload: { itemType: SelectableItemType; id: string };
    }
  | { type: 'CLEAR_SELECTED'; payload: { itemType: SelectableItemType } }
  | { type: 'CLEAR_SUPER_SELECTED'; payload: { itemType: SelectableItemType } }
  | { type: 'CLEAR_ALL_TYPE'; payload: { itemType: SelectableItemType } }
  | { type: 'CLEAR_ALL' };

// 5. Define the reducer function to handle state updates
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
      const isSuperSelected = state.superSelected[itemType].includes(id);
      const isSelected = state.selected[itemType].includes(id);

      let nextSelected = [...state.selected[itemType]];
      let nextSuperSelected = [...state.superSelected[itemType]];

      if (isSuperSelected) {
        nextSelected = nextSelected.filter((itemId) => itemId !== id);
        nextSuperSelected = nextSuperSelected.filter((itemId) => itemId !== id);
      } else if (isSelected) {
        nextSuperSelected.push(id);
      } else {
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
      return {
        ...state,
        selected: {
          ...state.selected,
          [itemType]: [],
        },
        superSelected: {
          ...state.superSelected,
          [itemType]: [], // Also clear superSelected
        },
      };
    }

    case 'CLEAR_SUPER_SELECTED': {
      const { itemType } = action.payload;
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
      // Reset to the default initial state
      // *** Also remove the state from localStorage ***
      localStorage.removeItem(FILTER_STORAGE_KEY);
      console.log(
        '[FilterContext] Cleared all filters and removed from localStorage.'
      );
      return initialState;
    }

    default:
      return state;
  }
};

// 6. Define the shape of the context value
interface FilterContextProps {
  state: FilterState;
  dispatch: Dispatch<FilterAction>;
  toggleSelection: (itemType: SelectableItemType, id: string) => void;
  clearSelected: (itemType: SelectableItemType) => void;
  clearSuperSelected: (itemType: SelectableItemType) => void;
  clearAllByType: (itemType: SelectableItemType) => void;
  clearAll: () => void;
}

// 7. Create the context
const FilterContext = createContext<FilterContextProps | undefined>(undefined);

// 8. Create the Provider component
interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  // *** Initialize state using the load function ***
  const [state, dispatch] = useReducer(
    filterReducer,
    initialState,
    loadStateFromStorage
  );

  // *** Add useEffect to save state changes to localStorage ***
  useEffect(() => {
    try {
      const stateToSave = JSON.stringify(state);
      localStorage.setItem(FILTER_STORAGE_KEY, stateToSave);
      console.log('[FilterContext] Saved state to localStorage:', state);
    } catch (error) {
      console.error(
        '[FilterContext] Error saving filter state to localStorage:',
        error
      );
    }
    // This effect runs whenever the 'state' object changes.
  }, [state]);

  // Memoized action functions (remain the same)
  const toggleSelection = useCallback(
    /* ... */ (itemType: SelectableItemType, id: string) => {
      dispatch({ type: 'TOGGLE_SELECTION', payload: { itemType, id } });
    },
    []
  );
  const clearSelected = useCallback(
    /* ... */ (itemType: SelectableItemType) => {
      dispatch({ type: 'CLEAR_SELECTED', payload: { itemType } });
    },
    []
  );
  const clearSuperSelected = useCallback(
    /* ... */ (itemType: SelectableItemType) => {
      dispatch({ type: 'CLEAR_SUPER_SELECTED', payload: { itemType } });
    },
    []
  );
  const clearAllByType = useCallback(
    /* ... */ (itemType: SelectableItemType) => {
      dispatch({ type: 'CLEAR_ALL_TYPE', payload: { itemType } });
    },
    []
  );
  const clearAll = useCallback(
    /* ... */ () => {
      dispatch({ type: 'CLEAR_ALL' });
    },
    []
  );

  // Context value (remains the same)
  const value = {
    state,
    dispatch,
    toggleSelection,
    clearSelected,
    clearSuperSelected,
    clearAllByType,
    clearAll,
  };

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
};

// 9. Create the custom hook for consuming the context (remains the same)
export const useFilterContext = (): FilterContextProps => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};
