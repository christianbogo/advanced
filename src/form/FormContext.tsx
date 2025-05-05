// src/form/FormContext.tsx

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
  Dispatch,
  useMemo,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  deleteDoc,
  FieldValue,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase'; // Adjust path

// --- Types ---
export type SelectableItemType =
  | 'team'
  | 'season'
  | 'meet'
  | 'athlete'
  | 'person'
  | 'result'
  | 'event'; // <<< UPDATED: Added 'event' type

export type FormMode = 'view' | 'edit' | 'add' | null;

export interface SelectedItemState {
  id: string | null;
  type: SelectableItemType | null;
  mode: FormMode;
}

// Interface for data read from Firestore (includes Timestamps)
export interface FormDataWithTimestamps {
  id?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: any;
}

// Interface for data being written to Firestore (allows FieldValue for timestamps)
interface FormDataToWrite {
  [key: string]: any;
  createdAt?: FieldValue;
  updatedAt?: FieldValue;
}

export interface FormState {
  selectedItem: SelectedItemState;
  formData: FormDataWithTimestamps | null;
  originalFormData: FormDataWithTimestamps | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialFormState: FormState = {
  selectedItem: { id: null, type: null, mode: null },
  formData: null,
  originalFormData: null,
  isLoading: false,
  isSaving: false,
  error: null,
};

// --- Actions --- (No changes needed here)
type FormAction =
  | {
      type: 'SELECT_ITEM_FOR_FORM';
      payload: { type: SelectableItemType; id: string | null; mode: FormMode };
    }
  | { type: 'CLEAR_FORM' }
  | { type: 'LOAD_FORM_DATA_START' }
  | { type: 'LOAD_FORM_DATA_SUCCESS'; payload: any }
  | { type: 'LOAD_FORM_DATA_ERROR'; payload: string }
  | { type: 'UPDATE_FORM_DATA'; payload: { field: string; value: any } }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'DELETE_SUCCESS' }
  | { type: 'REVERT_FORM_DATA' };

// --- Reducer --- (No changes needed here)
const formReducer = (state: FormState, action: FormAction): FormState => {
  logger.log(
    'Reducer Action:',
    action.type,
    'Payload:',
    'payload' in action ? action.payload : 'N/A'
  );
  switch (action.type) {
    // Cases remain the same...
    case 'SELECT_ITEM_FOR_FORM': {
      const { type, id, mode } = action.payload;
      const currentItem = state.selectedItem;
      // Prevent unnecessary state updates if only mode changes on the same item
      if (
        currentItem.id === id &&
        currentItem.type === type &&
        currentItem.mode === mode
      ) {
        return state; // No change needed
      }
      // If type or ID changes, reset form data and set loading state if ID exists
      if (currentItem.id !== id || currentItem.type !== type) {
        return {
          ...state,
          selectedItem: action.payload,
          formData: null, // Clear form data when item changes
          originalFormData: null, // Clear original data
          isLoading: !!id && mode !== 'add', // Set loading only if viewing/editing an existing item
          error: null,
          isSaving: false,
        };
      }
      // If only mode changes on the same item (e.g., view -> edit)
      else {
        return {
          ...state,
          selectedItem: { ...currentItem, mode: mode },
          // Keep existing formData and originalFormData
          isLoading: false, // Shouldn't be loading if only mode changes
          isSaving: false, // Reset saving state
          error: null, // Clear any previous errors
        };
      }
    }
    case 'CLEAR_FORM':
      return initialFormState;
    case 'LOAD_FORM_DATA_START':
      return {
        ...state,
        isLoading: true,
        formData: null,
        originalFormData: null,
        error: null,
      };
    case 'LOAD_FORM_DATA_SUCCESS':
      return {
        ...state,
        isLoading: false,
        formData: action.payload,
        originalFormData: action.payload, // Store the initially loaded data
        error: null,
      };
    case 'LOAD_FORM_DATA_ERROR':
      return {
        ...state,
        isLoading: false,
        formData: null,
        originalFormData: null,
        error: action.payload,
      };
    case 'UPDATE_FORM_DATA':
      // Ensure formData is not null before trying to spread it
      const currentFormData = state.formData || {};
      return {
        ...state,
        formData: {
          ...currentFormData,
          [action.payload.field]: action.payload.value,
        },
        // Optionally clear error when user starts typing again
        // error: null,
      };
    case 'SET_SAVING':
      return {
        ...state,
        isSaving: action.payload,
        error: action.payload ? null : state.error, // Clear error when starting to save
      };
    case 'SET_ERROR':
      return { ...state, isSaving: false, error: action.payload };
    case 'SAVE_SUCCESS':
      // After successful save, update originalFormData to match the saved state
      // and switch mode back to 'view'
      return {
        ...state,
        isSaving: false,
        error: null,
        selectedItem: { ...state.selectedItem, mode: 'view' },
        originalFormData: state.formData, // Update original data upon successful save
      };
    case 'DELETE_SUCCESS':
      logger.log('Delete successful, clearing form.');
      return initialFormState; // Reset entire form state on delete
    case 'REVERT_FORM_DATA':
      // Revert formData back to the last known good state (originalFormData)
      logger.log('Reverting formData to original fetched/saved data.');
      return {
        ...state,
        formData: state.originalFormData, // Revert to original
        error: null, // Clear any transient errors
        // Keep isSaving false, mode should typically be switched back to 'view' via selectItemForForm if needed
      };
    default:
      // Ensure exhaustive check if using TypeScript discriminated unions, otherwise default:
      // const exhaustiveCheck: never = action; // This line would cause a compile error if a case is missed
      return state;
  }
};

// --- Context Definition --- (No changes needed here)
interface FormContextProps {
  state: FormState;
  dispatch: Dispatch<FormAction>;
  selectItemForForm: (
    type: SelectableItemType,
    id: string | null,
    mode: FormMode
  ) => void;
  clearForm: () => void;
  updateFormField: (field: string, value: any) => void;
  saveForm: () => Promise<void>;
  revertFormData: () => void;
  deleteItem: () => Promise<void>;
}

const FormContext = createContext<FormContextProps | undefined>(undefined);

// --- Provider Component ---
interface FormProviderProps {
  children: ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const queryClient = useQueryClient();

  // --- Action Dispatchers --- (No changes needed here, definitions folded for brevity)
  const selectItemForForm = useCallback(
    (type: SelectableItemType, id: string | null, mode: FormMode) => {
      dispatch({ type: 'SELECT_ITEM_FOR_FORM', payload: { type, id, mode } });
    },
    []
  );
  const clearForm = useCallback(() => {
    dispatch({ type: 'CLEAR_FORM' });
  }, []);
  const updateFormField = useCallback((field: string, value: any) => {
    dispatch({ type: 'UPDATE_FORM_DATA', payload: { field, value } });
  }, []);
  const revertFormData = useCallback(() => {
    dispatch({ type: 'REVERT_FORM_DATA' });
  }, []);

  // --- Save Logic ---
  const saveForm = useCallback(async () => {
    const { selectedItem, formData } = state;
    if (!selectedItem.type || !formData) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Cannot save: No item selected or form data missing.',
      });
      return;
    }

    // Basic validation (Consider moving type-specific validation to respective forms)
    if (
      selectedItem.type === 'team' &&
      (!formData.code || !formData.nameShort)
    ) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Team Code and Short Name are required.',
      });
      return;
    }
    // <<< Add event-specific validation here if desired, OR handle in EventsForm.tsx >>>
    // Example:
    // if (selectedItem.type === 'event' && (!formData.code || !formData.nameShort /* ... other required fields */)) {
    //   dispatch({ type: 'SET_ERROR', payload: 'Event Code, Name, etc. are required.' });
    //   return;
    // }

    dispatch({ type: 'SET_SAVING', payload: true });

    // <<< UPDATED: Added 'event' mapping >>>
    const collectionMap: Record<SelectableItemType, string> = {
      team: 'teams',
      season: 'seasons',
      meet: 'meets',
      athlete: 'athletes',
      person: 'people',
      result: 'results',
      event: 'events', // Added event mapping
    };
    const collectionPath = collectionMap[selectedItem.type];

    // Should not happen if type is validated, but good practice
    if (!collectionPath) {
      dispatch({
        type: 'SET_ERROR',
        payload: `Unknown item type: ${selectedItem.type}`,
      });
      dispatch({ type: 'SET_SAVING', payload: false });
      logger.error(
        `Invalid item type "${selectedItem.type}" passed to saveForm.`
      );
      return;
    }

    const dataToSave: FormDataToWrite = { ...formData };
    delete dataToSave.id;
    delete dataToSave.createdAt;
    delete dataToSave.updatedAt;

    try {
      if (selectedItem.mode === 'add') {
        dataToSave.createdAt = serverTimestamp();
        dataToSave.updatedAt = serverTimestamp();
        const docRef = await addDoc(collection(db, collectionPath), dataToSave);
        logger.log('Document added with ID:', docRef.id);
        // Dispatch SAVE_SUCCESS to update state (e.g., switch mode to view)
        // *And* update the selectedItem with the new ID
        dispatch({ type: 'SAVE_SUCCESS' });
        // Now update the selected item in the context to reflect the new ID and view mode
        // This allows the form to stay populated with the newly created item in view mode
        dispatch({
          type: 'SELECT_ITEM_FOR_FORM',
          payload: { type: selectedItem.type, id: docRef.id, mode: 'view' },
        });
      } else if (selectedItem.mode === 'edit' && selectedItem.id) {
        dataToSave.updatedAt = serverTimestamp();
        const docRef = doc(db, collectionPath, selectedItem.id);
        await updateDoc(docRef, dataToSave);
        logger.log('Document updated:', selectedItem.id);
        dispatch({ type: 'SAVE_SUCCESS' }); // Updates state (mode to view, originalFormData)
      } else {
        throw new Error(
          `Invalid mode "${selectedItem.mode}" for saving item type "${selectedItem.type}".`
        );
      }

      // Invalidate the query for the list view to refetch fresh data
      queryClient.invalidateQueries({ queryKey: [collectionPath] });
    } catch (err: any) {
      logger.error('Error saving document:', err);
      dispatch({
        type: 'SET_ERROR',
        payload: err.message || 'Failed to save data.',
      });
      // Ensure saving is set to false on error
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state, queryClient]); // Removed dispatch from dependencies as it's stable

  // --- Delete Logic ---
  const deleteItem = useCallback(async () => {
    const { selectedItem, formData } = state;
    if (!selectedItem.type || !selectedItem.id) {
      logger.warn('Delete cancelled: No item selected or missing ID.');
      return; // Exit if no type or ID
    }

    // Confirmation Dialog
    if (
      !window.confirm(
        `Are you sure you want to delete this ${selectedItem.type} (${formData?.code || selectedItem.id})? This action cannot be undone.` // Added item identifier
      )
    ) {
      logger.log('Delete cancelled by user.');
      return;
    }

    dispatch({ type: 'SET_SAVING', payload: true }); // Indicate processing

    // <<< UPDATED: Added 'event' mapping >>>
    const collectionMap: Record<SelectableItemType, string> = {
      team: 'teams',
      season: 'seasons',
      meet: 'meets',
      athlete: 'athletes',
      person: 'people',
      result: 'results',
      event: 'events', // Added event mapping
    };
    const collectionPath = collectionMap[selectedItem.type];

    if (!collectionPath) {
      dispatch({
        type: 'SET_ERROR',
        payload: `Unknown item type: ${selectedItem.type}`,
      });
      dispatch({ type: 'SET_SAVING', payload: false });
      logger.error(
        `Invalid item type "${selectedItem.type}" passed to deleteItem.`
      );
      return;
    }

    try {
      const docRef = doc(db, collectionPath, selectedItem.id);
      await deleteDoc(docRef);
      logger.log(`Document deleted: ${collectionPath}/${selectedItem.id}`);
      dispatch({ type: 'DELETE_SUCCESS' }); // Resets form state via reducer

      // Invalidate the query for the list view
      queryClient.invalidateQueries({ queryKey: [collectionPath] });
    } catch (err: any) {
      logger.error(
        `Error deleting document ${collectionPath}/${selectedItem.id}:`,
        err
      );
      dispatch({
        type: 'SET_ERROR',
        payload: err.message || 'Failed to delete item.',
      });
      // Ensure saving is set to false on error
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state, queryClient]); // Removed dispatch, added formData?.code for confirmation dialog

  // --- Context Value --- (No changes needed here)
  const value = useMemo(
    () => ({
      state,
      dispatch,
      selectItemForForm,
      clearForm,
      updateFormField,
      saveForm,
      revertFormData,
      deleteItem,
    }),
    [
      state, // state changes frequently, so memo depends on it
      selectItemForForm, // stable due to useCallback([])
      clearForm, // stable due to useCallback([])
      updateFormField, // stable due to useCallback([])
      saveForm, // stable due to useCallback([state, queryClient])
      revertFormData, // stable due to useCallback([])
      deleteItem, // stable due to useCallback([state, queryClient])
    ]
  );

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};

// --- Custom Hook --- (No changes needed here)
export const useFormContext = (): FormContextProps => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

// Helper logger (No changes needed here)
const logger = {
  log: (...args: any[]) => console.log('[FormContext]', ...args),
  warn: (...args: any[]) => console.warn('[FormContext]', ...args),
  error: (...args: any[]) => console.error('[FormContext]', ...args),
};
