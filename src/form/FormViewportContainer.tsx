// src/form/FormViewportContainer.tsx

import React, { useEffect } from 'react';
import { useFormContext } from './FormContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase'; // Adjust path as needed
import { SelectableItemType } from './FormContext';

// Import existing forms
import TeamsForm from '../window/teams/TeamsForm';
import SeasonsForm from '../window/seasons/SeasonsForm';
import MeetsForm from '../window/meets/MeetsForm';
// --- Import the new PeopleForm ---
import PeopleForm from '../window/persons/PersonsForm'; // Adjust path as needed
import AthletesForm from '../window/athletes/AthletesForm';

function FormViewportContainer() {
  const { state, dispatch } = useFormContext();
  const { selectedItem, isLoading, error, formData } = state;

  // Effect to fetch data when the selected item changes
  useEffect(() => {
    if (!selectedItem.type || !selectedItem.id) {
      // No item selected for viewing/editing (could be 'add' mode or nothing selected)
      // We might dispatch CLEAR_FORM_DATA here if needed, but CLEAR_FORM in reducer handles it mostly.
      return;
    }

    // --- UPDATED collectionMap ---
    const collectionMap: Record<SelectableItemType, string> = {
      team: 'teams',
      season: 'seasons',
      meet: 'meets',
      athlete: 'athletes',
      person: 'people', // Corrected collection name
      result: 'results',
    };
    // --- END UPDATED collectionMap ---

    const collectionPath = collectionMap[selectedItem.type];
    if (!collectionPath) {
      const errorMsg = `Form fetch error: Unknown item type: ${selectedItem.type}`;
      dispatch({ type: 'LOAD_FORM_DATA_ERROR', payload: errorMsg });
      console.error(errorMsg);
      return;
    }

    const fetchData = async () => {
      // Make sure we don't try to fetch if mode is 'add' even if type is set
      if (selectedItem.mode === 'add') {
        // In 'add' mode, we don't fetch, we usually start with an empty/default form state
        // The reducer handles setting formData to null when SELECT_ITEM_FOR_FORM changes item
        // We might need a specific action/logic if default values are needed for 'add' mode
        console.log(
          `[FormViewportContainer] In 'add' mode for ${selectedItem.type}, skipping fetch.`
        );
        // Ensure isLoading is false if we skip fetch
        if (state.isLoading) {
          // This might need a dedicated action like LOAD_CANCELLED or rely on reducer logic
          // For now, we assume reducer handled initial state correctly for 'add'
        }
        return;
      }

      console.log(
        `[FormViewportContainer] Fetching data for ${selectedItem.type} ID: ${selectedItem.id}`
      );
      dispatch({ type: 'LOAD_FORM_DATA_START' });
      try {
        if (!selectedItem.id) {
          throw new Error('Selected item ID is null or undefined.');
        }
        const docRef = doc(db, collectionPath, selectedItem.id); // ID must be non-null here
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const fetchedData = { id: docSnap.id, ...docSnap.data() };
          dispatch({ type: 'LOAD_FORM_DATA_SUCCESS', payload: fetchedData });
          console.log(
            `Workspaceed data for ${selectedItem.type} ${selectedItem.id}:`,
            fetchedData
          );
        } else {
          const errorMsg = `${selectedItem.type} with ID ${selectedItem.id} not found.`;
          console.error(
            `Document not found: ${collectionPath}/${selectedItem.id}`
          );
          dispatch({ type: 'LOAD_FORM_DATA_ERROR', payload: errorMsg });
        }
      } catch (err: any) {
        const errorMsg =
          err.message || `Failed to fetch ${selectedItem.type} data.`;
        console.error(
          `Error fetching document ${collectionPath}/${selectedItem.id}:`,
          err
        );
        dispatch({ type: 'LOAD_FORM_DATA_ERROR', payload: errorMsg });
      }
    };

    fetchData();

    // Dependency array includes id, type, and mode to refetch if any change
    // Also include dispatch as per eslint rules
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem.id, selectedItem.type, selectedItem.mode, dispatch]); // Added mode and isLoading

  // --- Render Logic ---

  if (isLoading) {
    return <div className="form-message">Loading form data...</div>;
  }

  if (error) {
    // You might want to allow clearing the error state somehow
    return <div className="form-message error">Error: {error}</div>;
  }

  // Handle 'add' mode separately or rely on form component to render blank fields
  if (selectedItem.mode === 'add' && selectedItem.type) {
    // Render the appropriate form with null/empty data for 'add' mode
  } else if (!selectedItem.id || !selectedItem.type) {
    // No item selected and not in 'add' mode
    return (
      <div className="form-message">
        Select an item from a list to view or edit details, or click 'Add'.
      </div>
    );
  }

  // --- Render Specific Form ---
  switch (selectedItem.type) {
    case 'team':
      return <TeamsForm formData={formData} mode={selectedItem.mode} />;
    case 'season':
      return <SeasonsForm formData={formData} mode={selectedItem.mode} />;
    case 'meet':
      return <MeetsForm formData={formData} mode={selectedItem.mode} />;
    case 'athlete':
      // Placeholder - Replace with AthletesForm when created
      return <AthletesForm formData={formData} mode={selectedItem.mode} />;

    // --- UPDATED Case for 'person' ---
    case 'person':
      // Render the actual PeopleForm component
      return <PeopleForm formData={formData} mode={selectedItem.mode} />;
    // --- END UPDATED Case ---

    case 'result':
      // Placeholder - Replace with ResultsForm when created
      return (
        <div className="form-message">
          Displaying Result Form (Placeholder) for ID:{' '}
          {selectedItem.id ?? 'New'}
        </div>
      );

    default:
      // Should not happen if selectedItem.type is validated, but provides a fallback
      return <div className="form-message">Select an item type.</div>;
  }
}

export default FormViewportContainer;
