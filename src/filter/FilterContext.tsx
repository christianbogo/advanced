import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
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

// 3. Define the initial state
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
  switch (action.type) {
    case 'TOGGLE_SELECTION': {
      const { itemType, id } = action.payload;
      const isSuperSelected = state.superSelected[itemType].includes(id);
      const isSelected = state.selected[itemType].includes(id);

      // Create new arrays to avoid direct state mutation
      let nextSelected = [...state.selected[itemType]];
      let nextSuperSelected = [...state.superSelected[itemType]];

      if (isSuperSelected) {
        // If superSelected, remove from both
        nextSelected = nextSelected.filter((itemId) => itemId !== id);
        nextSuperSelected = nextSuperSelected.filter((itemId) => itemId !== id);
      } else if (isSelected) {
        // If selected (but not superSelected), move to superSelected
        // (It remains in selected as well, implicitly)
        nextSuperSelected.push(id);
      } else {
        // If not selected at all, add to selected
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
      // Also clear superSelected if clearing selected, as superSelected implies selected
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
      // Only clear superSelected, leave selected items as they are
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
      return initialState; // Reset everything
    }

    default:
      return state;
  }
};

// 6. Define the shape of the context value
interface FilterContextProps {
  state: FilterState;
  // Expose dispatch directly or create specific action functions
  dispatch: Dispatch<FilterAction>;
  // Helper functions for convenience (optional but recommended)
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
  const [state, dispatch] = useReducer(filterReducer, initialState);

  // Memoize action functions to prevent unnecessary re-renders of consumers
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

  const value = {
    state,
    dispatch, // You might choose to not expose dispatch directly
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

// 9. Create the custom hook for consuming the context
export const useFilterContext = (): FilterContextProps => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};
