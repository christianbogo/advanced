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
import { db } from '../firebase/firebase'; // Adjust path as necessary

// --- Types ---
export type SelectableItemType =
  | 'team'
  | 'season'
  | 'meet'
  | 'athlete'
  | 'person'
  | 'result'
  | 'event';

export type FormMode = 'view' | 'edit' | 'add' | null;

export interface SelectedItemState {
  id: string | null;
  type: SelectableItemType | null;
  mode: FormMode;
}

export interface FormDataWithTimestamps {
  id?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: any;
}

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

// --- Actions ---
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

// --- Reducer ---
const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SELECT_ITEM_FOR_FORM': {
      const { type, id, mode } = action.payload;
      const currentItem = state.selectedItem;
      if (
        currentItem.id === id &&
        currentItem.type === type &&
        currentItem.mode === mode
      ) {
        return state;
      }
      if (currentItem.id !== id || currentItem.type !== type) {
        return {
          ...state,
          selectedItem: action.payload,
          formData: null,
          originalFormData: null,
          isLoading: !!id && mode !== 'add',
          error: null,
          isSaving: false,
        };
      } else {
        return {
          ...state,
          selectedItem: { ...currentItem, mode: mode },
          isLoading: false,
          isSaving: false,
          error: null,
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
        originalFormData: action.payload,
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
      const currentFormData = state.formData || {};
      return {
        ...state,
        formData: {
          ...currentFormData,
          [action.payload.field]: action.payload.value,
        },
      };
    case 'SET_SAVING':
      return {
        ...state,
        isSaving: action.payload,
        error: action.payload ? null : state.error,
      };
    case 'SET_ERROR':
      return { ...state, isSaving: false, error: action.payload };
    case 'SAVE_SUCCESS':
      return {
        ...state,
        isSaving: false,
        error: null,
        selectedItem: { ...state.selectedItem, mode: 'view' },
        originalFormData: state.formData,
      };
    case 'DELETE_SUCCESS':
      return initialFormState;
    case 'REVERT_FORM_DATA':
      return {
        ...state,
        formData: state.originalFormData,
        error: null,
      };
    default:
      return state;
  }
};

// --- Context Definition ---
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

// Defines the mapping from SelectableItemType to Firestore collection names.
// This could be moved to a shared constants/config file if used elsewhere.
const COLLECTION_PATHS: Record<SelectableItemType, string> = {
  team: 'teams',
  season: 'seasons',
  meet: 'meets',
  athlete: 'athletes',
  person: 'people',
  result: 'results',
  event: 'events',
};

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const queryClient = useQueryClient();

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

  const saveForm = useCallback(async () => {
    const { selectedItem, formData } = state;
    if (!selectedItem.type || !formData) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Cannot save: No item selected or form data missing.',
      });
      return;
    }

    // Basic validation example - consider more robust or schema-based validation
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

    dispatch({ type: 'SET_SAVING', payload: true });

    const collectionPath = COLLECTION_PATHS[selectedItem.type];
    if (!collectionPath) {
      const errorMessage = `Unknown item type: ${selectedItem.type}`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_SAVING', payload: false });
      console.error(
        `[FormContext] Invalid item type "${selectedItem.type}" passed to saveForm.`
      );
      return;
    }

    const dataToSave: FormDataToWrite = { ...formData };
    delete dataToSave.id; // Remove client-side ID before saving
    // Firestore manages these timestamps, so remove them if they exist from client-side data
    delete dataToSave.createdAt;
    delete dataToSave.updatedAt;

    try {
      if (selectedItem.mode === 'add') {
        dataToSave.createdAt = serverTimestamp();
        dataToSave.updatedAt = serverTimestamp();
        const docRef = await addDoc(collection(db, collectionPath), dataToSave);
        dispatch({ type: 'SAVE_SUCCESS' });
        // Update context to reflect the newly created item in view mode
        dispatch({
          type: 'SELECT_ITEM_FOR_FORM',
          payload: { type: selectedItem.type, id: docRef.id, mode: 'view' },
        });
      } else if (selectedItem.mode === 'edit' && selectedItem.id) {
        dataToSave.updatedAt = serverTimestamp();
        const docRef = doc(db, collectionPath, selectedItem.id);
        await updateDoc(docRef, dataToSave);
        dispatch({ type: 'SAVE_SUCCESS' });
      } else {
        throw new Error(
          `Invalid mode "${selectedItem.mode}" for saving item type "${selectedItem.type}".`
        );
      }
      queryClient.invalidateQueries({ queryKey: [collectionPath] });
    } catch (err: any) {
      console.error('[FormContext] Error saving document:', err); // Keep critical error logs
      dispatch({
        type: 'SET_ERROR',
        payload: err.message || 'Failed to save data.',
      });
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state, queryClient]);

  const deleteItem = useCallback(async () => {
    const { selectedItem, formData } = state;
    if (!selectedItem.type || !selectedItem.id) {
      console.warn(
        '[FormContext] Delete cancelled: No item selected or missing ID.'
      ); // Keep for debugging
      return;
    }

    const itemName = formData?.code || formData?.name || selectedItem.id; // Attempt to get a user-friendly name

    if (
      !window.confirm(
        `Are you sure you want to delete this ${selectedItem.type} (${itemName})? This action cannot be undone.`
      )
    ) {
      return;
    }

    dispatch({ type: 'SET_SAVING', payload: true });

    const collectionPath = COLLECTION_PATHS[selectedItem.type];
    if (!collectionPath) {
      const errorMessage = `Unknown item type: ${selectedItem.type}`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_SAVING', payload: false });
      console.error(
        `[FormContext] Invalid item type "${selectedItem.type}" passed to deleteItem.`
      );
      return;
    }

    try {
      const docRef = doc(db, collectionPath, selectedItem.id);
      await deleteDoc(docRef);
      dispatch({ type: 'DELETE_SUCCESS' });
      queryClient.invalidateQueries({ queryKey: [collectionPath] });
    } catch (err: any) {
      console.error(
        `[FormContext] Error deleting document ${collectionPath}/${selectedItem.id}:`,
        err
      ); // Keep critical error logs
      dispatch({
        type: 'SET_ERROR',
        payload: err.message || 'Failed to delete item.',
      });
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state, queryClient]);

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
      state,
      selectItemForForm,
      clearForm,
      updateFormField,
      saveForm,
      revertFormData,
      deleteItem,
    ]
  );

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};

export const useFormContext = (): FormContextProps => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};
