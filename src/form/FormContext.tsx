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
  serverTimestamp, // Keep this import
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
  | 'result';

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
  [key: string]: any; // Allow other fields from formData
  createdAt?: FieldValue; // Allow FieldValue for creation
  updatedAt?: FieldValue; // Allow FieldValue for update/creation
}

export interface FormState {
  selectedItem: SelectedItemState;
  formData: FormDataWithTimestamps | null; // Expect Timestamp when reading/displaying
  originalFormData: FormDataWithTimestamps | null; // Expect Timestamp for original
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
  // (Reducer logic remains the same)
  logger.log(
    'Reducer Action:',
    action.type,
    'Payload:',
    'payload' in action ? action.payload : 'N/A'
  );
  switch (action.type) {
    case 'SELECT_ITEM_FOR_FORM': {
      const { type, id, mode } = action.payload;
      const currentItem = state.selectedItem;
      if (currentItem.id === id && currentItem.type === type) {
        if (currentItem.mode !== mode) {
          return {
            ...state,
            selectedItem: { ...currentItem, mode: mode },
            isSaving: false,
            error: null,
          };
        } else {
          return state;
        }
      } else {
        return {
          ...state,
          selectedItem: action.payload,
          formData: null,
          originalFormData: null,
          isLoading: !!id,
          error: null,
          isSaving: false,
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
      logger.log('Delete successful, clearing form.');
      return initialFormState;
    case 'REVERT_FORM_DATA':
      logger.log('Reverting formData to original fetched data.');
      return { ...state, formData: state.originalFormData, error: null };
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

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const queryClient = useQueryClient();

  // --- Action Dispatchers (remain the same) ---
  const selectItemForForm = useCallback(
    /* ... */ (type: SelectableItemType, id: string | null, mode: FormMode) => {
      dispatch({ type: 'SELECT_ITEM_FOR_FORM', payload: { type, id, mode } });
    },
    []
  );
  const clearForm = useCallback(
    /* ... */ () => {
      dispatch({ type: 'CLEAR_FORM' });
    },
    []
  );
  const updateFormField = useCallback(
    /* ... */ (field: string, value: any) => {
      dispatch({ type: 'UPDATE_FORM_DATA', payload: { field, value } });
    },
    []
  );
  const revertFormData = useCallback(
    /* ... */ () => {
      dispatch({ type: 'REVERT_FORM_DATA' });
    },
    []
  );

  // --- Save Logic (UPDATED TYPES) ---
  const saveForm = useCallback(async () => {
    const { selectedItem, formData } = state;
    if (!selectedItem.type || !formData) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Cannot save: No item selected or form data missing.',
      });
      return;
    }
    if (
      selectedItem.type === 'team' &&
      (!formData.code || !formData.nameShort)
    ) {
      /* ... validation error ... */ return;
    }
    dispatch({ type: 'SET_SAVING', payload: true });
    const collectionMap: Record<SelectableItemType, string> = {
      team: 'teams',
      season: 'seasons',
      meet: 'meets',
      athlete: 'athletes',
      person: 'people',
      result: 'results',
    };
    const collectionPath = collectionMap[selectedItem.type];

    // Prepare data for saving using the FormDataToWrite type
    // This allows FieldValue for timestamps but keeps other fields
    const dataToSave: FormDataToWrite = { ...formData };

    // Remove fields that shouldn't be written directly
    delete dataToSave.id; // Don't write the document ID as a field
    // Ensure client cannot override server timestamps by removing existing ones
    delete dataToSave.createdAt;
    delete dataToSave.updatedAt;

    try {
      if (selectedItem.mode === 'add') {
        // Add server timestamps for new documents
        dataToSave.createdAt = serverTimestamp(); // Assign FieldValue
        dataToSave.updatedAt = serverTimestamp(); // Assign FieldValue
        const docRef = await addDoc(collection(db, collectionPath), dataToSave);
        logger.log('Document added with ID:', docRef.id);
      } else if (selectedItem.mode === 'edit' && selectedItem.id) {
        // Only add updatedAt server timestamp for existing documents
        dataToSave.updatedAt = serverTimestamp(); // Assign FieldValue
        const docRef = doc(db, collectionPath, selectedItem.id);
        // Pass the correctly typed object to updateDoc
        await updateDoc(docRef, dataToSave);
        logger.log('Document updated:', selectedItem.id);
      } else {
        throw new Error('Invalid mode for saving.');
      }

      dispatch({ type: 'SAVE_SUCCESS' });
      // After successful save, the SAVE_SUCCESS action updates originalFormData
      // We also need to refetch the list data
      queryClient.invalidateQueries({ queryKey: [collectionPath] });
    } catch (err: any) {
      logger.error('Error saving document:', err);
      dispatch({
        type: 'SET_ERROR',
        payload: err.message || 'Failed to save data.',
      });
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state, queryClient]);

  // --- Delete Logic (remains the same) ---
  const deleteItem = useCallback(async () => {
    const { selectedItem } = state;
    if (!selectedItem.type || !selectedItem.id) {
      /* ... */ return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete this ${selectedItem.type}? ...`
      )
    ) {
      return;
    }
    dispatch({ type: 'SET_SAVING', payload: true });
    const collectionMap: Record<SelectableItemType, string> = {
      team: 'teams',
      season: 'seasons',
      meet: 'meets',
      athlete: 'athletes',
      person: 'persons',
      result: 'results',
    };
    const collectionPath = collectionMap[selectedItem.type];
    try {
      const docRef = doc(db, collectionPath, selectedItem.id);
      await deleteDoc(docRef);
      logger.log('Document deleted:', selectedItem.id);
      dispatch({ type: 'DELETE_SUCCESS' });
      queryClient.invalidateQueries({ queryKey: [collectionPath] });
    } catch (err: any) {
      logger.error('Error deleting document:', err);
      dispatch({
        type: 'SET_ERROR',
        payload: err.message || 'Failed to delete item.',
      });
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state, queryClient]);

  // --- Context Value ---
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

// --- Custom Hook ---
export const useFormContext = (): FormContextProps => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

// Helper logger
const logger = {
  log: (...args: any[]) => console.log('[FormContext]', ...args),
  warn: (...args: any[]) => console.warn('[FormContext]', ...args),
  error: (...args: any[]) => console.error('[FormContext]', ...args),
};
