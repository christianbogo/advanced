import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
  Dispatch,
} from 'react';

export type SelectableItemType =
  | 'team'
  | 'season'
  | 'meet'
  | 'athlete'
  | 'person'
  | 'event'
  | 'result';

export interface FilterState {
  selected: {
    [key in SelectableItemType]: string[];
  };
  superSelected: {
    [key in SelectableItemType]: string[];
  };
}

const initialState: FilterState = {
  selected: {
    team: [],
    season: [],
    meet: [],
    athlete: [],
    person: [],
    event: [],
    result: [],
  },
  superSelected: {
    team: [],
    season: [],
    meet: [],
    athlete: [],
    person: [],
    event: [],
    result: [],
  },
};

const FILTER_STORAGE_KEY = 'appFilterState-v1';

const loadStateFromStorage = (): FilterState => {
  try {
    const storedState = localStorage.getItem(FILTER_STORAGE_KEY);
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      if (parsedState && parsedState.selected && parsedState.superSelected) {
        // Merge parsed state with initialState to ensure all keys exist,
        // especially if new SelectableItemTypes are added later.
        const mergedState: FilterState = {
          selected: {
            ...initialState.selected,
            ...parsedState.selected,
          },
          superSelected: {
            ...initialState.superSelected,
            ...parsedState.superSelected,
          },
        };
        return mergedState;
      }
    }
  } catch (error) {
    console.error(
      // Retaining this error log as it's crucial for debugging storage issues
      '[FilterContext] Error loading filter state from localStorage:',
      error
    );
  }
  return initialState;
};

type FilterAction =
  | {
      type: 'TOGGLE_SELECTION';
      payload: { itemType: SelectableItemType; id: string };
    }
  | { type: 'CLEAR_SELECTED'; payload: { itemType: SelectableItemType } }
  | { type: 'CLEAR_SUPER_SELECTED'; payload: { itemType: SelectableItemType } }
  | { type: 'CLEAR_ALL_TYPE'; payload: { itemType: SelectableItemType } }
  | { type: 'CLEAR_ALL' };

const filterReducer = (
  state: FilterState,
  action: FilterAction
): FilterState => {
  switch (action.type) {
    case 'TOGGLE_SELECTION': {
      const { itemType, id } = action.payload;
      const currentSelected = state.selected[itemType] || [];
      const currentSuperSelected = state.superSelected[itemType] || [];

      const isSuperSelected = currentSuperSelected.includes(id);
      const isSelected = currentSelected.includes(id);

      let nextSelected = [...currentSelected];
      let nextSuperSelected = [...currentSuperSelected];

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
          [itemType]: [], // Clearing selected also clears super-selected for that type
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
      localStorage.removeItem(FILTER_STORAGE_KEY);
      // Return a fresh copy of the initialState structure
      return {
        selected: { ...initialState.selected },
        superSelected: { ...initialState.superSelected },
      };
    }

    default:
      return state;
  }
};

interface FilterContextProps {
  state: FilterState;
  dispatch: Dispatch<FilterAction>;
  toggleSelection: (itemType: SelectableItemType, id: string) => void;
  clearSelected: (itemType: SelectableItemType) => void;
  clearSuperSelected: (itemType: SelectableItemType) => void;
  clearAllByType: (itemType: SelectableItemType) => void;
  clearAll: () => void;
}

const FilterContext = createContext<FilterContextProps | undefined>(undefined);

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(
    filterReducer,
    initialState,
    loadStateFromStorage
  );

  useEffect(() => {
    try {
      const stateToSave = JSON.stringify(state);
      localStorage.setItem(FILTER_STORAGE_KEY, stateToSave);
    } catch (error) {
      console.error(
        // Retaining this error log as it's crucial for debugging storage issues
        '[FilterContext] Error saving filter state to localStorage:',
        error
      );
    }
  }, [state]);

  const toggleSelection = useCallback(
    (itemType: SelectableItemType, id: string) => {
      dispatch({ type: 'TOGGLE_SELECTION', payload: { itemType, id } });
    },
    [] // dispatch is stable and does not need to be in the dependency array
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

  const value = React.useMemo(
    () => ({
      state,
      dispatch, // Exposing dispatch can be useful for more complex scenarios
      toggleSelection,
      clearSelected,
      clearSuperSelected,
      clearAllByType,
      clearAll,
    }),
    [
      state,
      // dispatch, // dispatch is stable
      toggleSelection,
      clearSelected,
      clearSuperSelected,
      clearAllByType,
      clearAll,
    ]
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
};

export const useFilterContext = (): FilterContextProps => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};
