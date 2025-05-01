// src/form/FormViewportContainer.tsx

import React, { useEffect } from 'react';
import { useFormContext } from './FormContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase'; // Adjust path to your firebase config
import { SelectableItemType } from './FormContext'; // Import type
import TeamsForm from '../window/teams/TeamsForm';
import SeasonsForm from '../window/seasons/SeasonsForm';

// Import specific form components (we'll create TeamsForm next)
// import TeamsForm from './TeamsForm';
// import SeasonsForm from './SeasonsForm'; // etc.

function FormViewportContainer() {
  // Get state and dispatch from the context
  const { state, dispatch } = useFormContext();
  const { selectedItem, isLoading, error, formData } = state;

  // Effect to fetch data when the selected item changes
  useEffect(() => {
    // Ensure we have a type and ID to fetch
    if (!selectedItem.type || !selectedItem.id) {
      // If no ID, it might be 'add' mode or cleared selection, ensure data is cleared
      if (formData) {
        // Optional: dispatch CLEAR_FORM or a specific CLEAR_FORM_DATA action if needed
        // dispatch({ type: 'CLEAR_FORM_DATA' }); // Example if you add such action
      }
      return; // Exit effect if no ID or type
    }

    // Determine the Firestore collection path based on the selected item type
    // Ensure this mapping is complete and correct for your data structure
    const collectionMap: Record<SelectableItemType, string> = {
      team: 'teams',
      season: 'seasons',
      meet: 'meets',
      athlete: 'athletes',
      person: 'persons',
      result: 'results',
      // Add other types if necessary
    };

    const collectionPath = collectionMap[selectedItem.type];
    if (!collectionPath) {
      dispatch({
        type: 'LOAD_FORM_DATA_ERROR',
        payload: `Unknown item type: ${selectedItem.type}`,
      });
      console.error(
        `Form fetch error: Unknown item type: ${selectedItem.type}`
      );
      return; // Exit if type is not mapped
    }

    const fetchData = async () => {
      dispatch({ type: 'LOAD_FORM_DATA_START' }); // Signal loading start
      try {
        const docRef = doc(db, collectionPath, selectedItem.id as string); // Cast ID as string
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Include the document ID along with its data
          const fetchedData = { id: docSnap.id, ...docSnap.data() };
          dispatch({ type: 'LOAD_FORM_DATA_SUCCESS', payload: fetchedData });
          console.log(
            `Fetched data for ${selectedItem.type} ${selectedItem.id}:`,
            fetchedData
          );

          // --- Special Case: Fetch related Person for Athlete ---
          // if (selectedItem.type === 'athlete' && fetchedData.person) {
          //   // TODO: Fetch the associated Person document and merge/store it
          //   // This might involve another state variable or merging into formData
          //   console.log('Need to fetch associated person:', fetchedData.person);
          // }
        } else {
          // Document not found
          console.error(
            `Document not found: ${collectionPath}/${selectedItem.id}`
          );
          dispatch({
            type: 'LOAD_FORM_DATA_ERROR',
            payload: `${selectedItem.type} with ID ${selectedItem.id} not found.`,
          });
        }
      } catch (err: any) {
        console.error(
          `Error fetching document ${collectionPath}/${selectedItem.id}:`,
          err
        );
        dispatch({
          type: 'LOAD_FORM_DATA_ERROR',
          payload: err.message || 'Failed to fetch data.',
        });
      }
    };

    fetchData();

    // Dependency array: Re-run effect if selected item ID or type changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem.id, selectedItem.type, dispatch]); // Include dispatch in dependencies

  // --- Render Logic ---

  // Display Loading State
  if (isLoading) {
    return <div className="form-message">Loading form data...</div>;
  }

  // Display Error State
  if (error) {
    return <div className="form-message error">Error: {error}</div>;
  }

  // Display Message if No Item Selected
  if (!selectedItem.id || !selectedItem.type) {
    // Only show placeholder if not in 'add' mode (which also has null id)
    if (selectedItem.mode !== 'add') {
      return (
        <div className="form-message">
          Select an item from a list to view or edit details.
        </div>
      );
    }
    // If in 'add' mode, we'll render the blank form below
  }

  // Display Specific Form Based on Selected Type
  // (Render placeholders for now, will replace with actual form components)
  switch (selectedItem.type) {
    case 'team':
      // Pass formData and mode down to the specific form component
      return <TeamsForm formData={formData} mode={selectedItem.mode} />;

    case 'season':
      return <SeasonsForm formData={formData} mode={selectedItem.mode} />;
    case 'meet':
      // return <MeetsForm formData={formData} mode={selectedItem.mode} />;
      return (
        <div className="form-message">
          Displaying Meet Form (Placeholder) for ID: {selectedItem.id ?? 'New'}
        </div>
      );
    case 'athlete':
      // Handle potential combined Athlete+Person data here
      // return <AthletesForm formData={formData} mode={selectedItem.mode} />;
      return (
        <div className="form-message">
          Displaying Athlete Form (Placeholder) for ID:{' '}
          {selectedItem.id ?? 'New'}
        </div>
      );
    case 'person':
      // return <PersonsForm formData={formData} mode={selectedItem.mode} />;
      return (
        <div className="form-message">
          Displaying Person Form (Placeholder) for ID:{' '}
          {selectedItem.id ?? 'New'}
        </div>
      );
    case 'result':
      // return <ResultsForm formData={formData} mode={selectedItem.mode} />;
      return (
        <div className="form-message">
          Displaying Result Form (Placeholder) for ID:{' '}
          {selectedItem.id ?? 'New'}
        </div>
      );

    default:
      // Handle cases where type is null or unknown, though the check above should catch null
      return <div className="form-message">Select an item.</div>;
  }
}

export default FormViewportContainer;
