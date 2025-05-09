import React, { useEffect } from 'react';
import {
  useFormContext,
  SelectableItemType,
  FormDataWithTimestamps,
  FormMode,
} from './FormContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

import TeamsForm from '../window/teams/TeamsForm';
import SeasonsForm from '../window/seasons/SeasonsForm';
import MeetsForm from '../window/meets/MeetsForm';
import PeopleForm from '../window/persons/PersonsForm';
import AthletesForm from '../window/athletes/AthletesForm';
import EventsForm from '../window/events/EventsForm';
import ResultsForm from '../window/results/ResultsForm';

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
      return;
    }

    const collectionPath = COLLECTION_PATHS_VIEWPORT[selectedItem.type];
    if (!collectionPath) {
      const errorMsg = `Form fetch error: Unknown item type: ${selectedItem.type}`;
      console.error(`[FormViewportContainer] ${errorMsg}`);
      dispatch({ type: 'LOAD_FORM_DATA_ERROR', payload: errorMsg });
      return;
    }

    const fetchData = async () => {
      dispatch({ type: 'LOAD_FORM_DATA_START' });
      try {
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
          );
          dispatch({ type: 'LOAD_FORM_DATA_ERROR', payload: errorMsg });
        }
      } catch (err: any) {
        const errorMsg =
          err.message || `Failed to fetch ${selectedItem.type} data.`;
        console.error(
          `[FormViewportContainer] Error fetching document ${collectionPath}/${selectedItem.id}:`,
          err
        );
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
      return <ResultsForm mode={selectedItem.mode as FormMode} />;
    case 'event':
      return (
        <EventsForm formData={formData} mode={selectedItem.mode as FormMode} />
      );
    default:
      if (selectedItem.type) {
        return (
          <div className="p-4 text-center text-orange-500">
            Invalid item type: {selectedItem.type}
          </div>
        );
      }
      return (
        <div className="p-4 text-center text-gray-500">
          Please select an item or an action.
        </div>
      );
  }
}

export default FormViewportContainer;
