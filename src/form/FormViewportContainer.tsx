import React, { useEffect } from 'react';
import {
  useFormContext,
  SelectableItemType,
  FormDataWithTimestamps,
  FormMode,
} from './FormContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase'; // Adjust path as needed

import TeamsForm from '../window/teams/TeamsForm';
import SeasonsForm from '../window/seasons/SeasonsForm';
import MeetsForm from '../window/meets/MeetsForm';
import PeopleForm from '../window/persons/PersonsForm'; // Adjust path as needed
import AthletesForm from '../window/athletes/AthletesForm';
import EventsForm from '../window/events/EventsForm';
import ResultsForm from '../window/results/ResultsForm';

// This mapping is identical to COLLECTION_PATHS in FormContext.tsx
// and is a candidate for centralization.
const COLLECTION_PATHS_VIEWPORT: Record<SelectableItemType, string> = {
  team: 'teams',
  season: 'seasons',
  meet: 'meets',
  athlete: 'athletes',
  person: 'people',
  result: 'results',
  event: 'events',
};

function FormViewportContainer() {
  const { state, dispatch } = useFormContext();
  const { selectedItem, isLoading, error, formData } = state;

  useEffect(() => {
    if (!selectedItem.type || !selectedItem.id || selectedItem.mode === 'add') {
      // If no specific item ID is present, or if we are in 'add' mode,
      // we don't need to fetch existing data.
      // The form will either be empty (for 'add') or show a placeholder.
      // If isLoading was true from a previous fetch, ensure it's reset if appropriate,
      // though the reducer logic for SELECT_ITEM_FOR_FORM should handle this.
      if (selectedItem.mode === 'add' && isLoading) {
        // Explicitly set loading to false if switching to 'add' mode for an item type
        // and a fetch was in progress or previously indicated.
        // This might be redundant if reducer handles it perfectly, but can be a safeguard.
        // Consider if a LOAD_FORM_DATA_CANCEL action would be cleaner.
        // For now, assuming reducer sets isLoading: false when mode becomes 'add'.
      }
      return;
    }

    const collectionPath = COLLECTION_PATHS_VIEWPORT[selectedItem.type];
    if (!collectionPath) {
      const errorMsg = `Form fetch error: Unknown item type: ${selectedItem.type}`;
      console.error(`[FormViewportContainer] ${errorMsg}`); // Keep critical error log
      dispatch({ type: 'LOAD_FORM_DATA_ERROR', payload: errorMsg });
      return;
    }

    const fetchData = async () => {
      dispatch({ type: 'LOAD_FORM_DATA_START' });
      try {
        // selectedItem.id is checked to be non-null by the initial guard clause in useEffect
        const docRef = doc(db, collectionPath, selectedItem.id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const fetchedData = {
            id: docSnap.id,
            ...docSnap.data(),
          } as FormDataWithTimestamps;
          dispatch({ type: 'LOAD_FORM_DATA_SUCCESS', payload: fetchedData });
        } else {
          const errorMsg = `${selectedItem.type} with ID ${selectedItem.id} not found.`;
          console.error(
            `[FormViewportContainer] Document not found: ${collectionPath}/${selectedItem.id}`
          ); // Keep critical error log
          dispatch({ type: 'LOAD_FORM_DATA_ERROR', payload: errorMsg });
        }
      } catch (err: any) {
        const errorMsg =
          err.message || `Failed to fetch ${selectedItem.type} data.`;
        console.error(
          `[FormViewportContainer] Error fetching document ${collectionPath}/${selectedItem.id}:`,
          err
        ); // Keep critical error log
        dispatch({ type: 'LOAD_FORM_DATA_ERROR', payload: errorMsg });
      }
    };

    fetchData();
  }, [selectedItem.id, selectedItem.type, selectedItem.mode, dispatch]);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">Loading form data...</div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  // If in 'add' mode, but no type is selected yet (e.g. initial state or after clearing form)
  // or if not in 'add' mode and no item ID/type is selected.
  if (
    (selectedItem.mode === 'add' && !selectedItem.type) ||
    (!selectedItem.mode && (!selectedItem.id || !selectedItem.type))
  ) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select an item from a list to view or edit details, or click 'Add' to
        create a new item.
      </div>
    );
  }

  // Render the specific form based on selectedItem.type
  // formData might be null in 'add' mode, or if there was an error,
  // or if data is still loading (though isLoading handles the loading message).
  // Individual forms should handle a null formData gracefully for 'add' mode.
  switch (selectedItem.type) {
    case 'team':
      return (
        <TeamsForm formData={formData} mode={selectedItem.mode as FormMode} />
      );
    case 'season':
      return (
        <SeasonsForm formData={formData} mode={selectedItem.mode as FormMode} />
      );
    case 'meet':
      return (
        <MeetsForm formData={formData} mode={selectedItem.mode as FormMode} />
      );
    case 'athlete':
      return (
        <AthletesForm
          formData={formData}
          mode={selectedItem.mode as FormMode}
        />
      );
    case 'person':
      return (
        <PeopleForm formData={formData} mode={selectedItem.mode as FormMode} />
      );
    case 'result':
      // Assuming ResultsForm will also take formData and mode
      return <ResultsForm mode={selectedItem.mode as FormMode} />;
    case 'event':
      return (
        <EventsForm formData={formData} mode={selectedItem.mode as FormMode} />
      );
    default:
      // This case should ideally not be reached if selectedItem.type is always valid when non-null.
      // If selectedItem.type is null (e.g. after CLEAR_FORM), the message above handles it.
      if (selectedItem.type) {
        // Only show if type is somehow invalid but present
        return (
          <div className="p-4 text-center text-orange-500">
            Invalid item type: {selectedItem.type}
          </div>
        );
      }
      // Fallback for any other unhandled state, though the initial message should cover most.
      return (
        <div className="p-4 text-center text-gray-500">
          Please select an item or an action.
        </div>
      );
  }
}

export default FormViewportContainer;
