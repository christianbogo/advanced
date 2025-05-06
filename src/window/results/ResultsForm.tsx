import React, { useMemo, useEffect, useState, useCallback } from 'react'; // Added useState, useCallback
import {
  useFormContext,
  FormMode,
  FormDataWithTimestamps,
} from '../../form/FormContext'; // Adjust path, import FormDataWithTimestamps
import { Result, Team, Event, Meet, Season, Person } from '../../models/index'; // Adjust path, import Person
import { Timestamp } from 'firebase/firestore';

// Hooks for dropdown data
import { useTeams } from '../teams/useTeams'; // Adjust path
import { useSeasons, SeasonWithTeamInfo } from '../seasons/useSeasons'; // Adjust path
import { useMeets, MeetWithContextInfo } from '../meets/useMeets'; // Adjust path
import { useEvents } from '../events/useEvents'; // Adjust path

// Utilities (ensure these helpers are available, e.g., from a utils file)
// *** MAKE SURE this path is correct for your project ***
import { formatTimestamp, boolToString, stringToBool } from '../../utils/form';

// *** TODO: Ensure fetchChunkedData is available (import or define) ***
// Example import:
// import { fetchChunkedData } from '../../hooks/useFetchChunkedData';
// Or define it here/nearby if not shared

// Placeholder for the modal component (we'll create this next)
// *** ADJUST PATH as needed ***
import AthleteSelectorModal from '../athletes/AthleteSelectorModal';

import '../../styles/form.css'; // Adjust path

// Props definition
interface ResultsFormProps {
  mode: FormMode; // Passed from FormViewportContainer
}

// Helper to safely get arrays from formData
const getSafeArray = (arr: any): string[] => (Array.isArray(arr) ? arr : []);

// *** TODO: Define or import fetchChunkedData if not already done ***
// Placeholder function signature:
async function fetchChunkedData<T extends { id?: string }>(
  ids: string[],
  collectionName: string
): Promise<Map<string, Partial<T>>> {
  console.warn('fetchChunkedData implementation is missing!');
  return new Map(); // Return empty map as placeholder
  // Add the actual implementation from useResults hook or shared utility here
}

const ResultsForm: React.FC<ResultsFormProps> = ({ mode }) => {
  // --- Hooks ---
  const {
    state,
    dispatch,
    updateFormField,
    selectItemForForm,
    saveForm,
    clearForm,
    revertFormData,
    deleteItem,
  } = useFormContext();
  const {
    selectedItem,
    isSaving,
    error,
    formData: currentFormDataUntyped,
  } = state;
  // Explicitly cast formData for better type safety within this component
  const currentFormData = currentFormDataUntyped as Partial<
    Result & FormDataWithTimestamps
  > | null;

  // Data fetching for dropdowns (remains the same)
  const { data: teams, isLoading: isLoadingTeams } = useTeams();
  const { data: allSeasons, isLoading: isLoadingSeasons } = useSeasons();
  const { data: allMeets, isLoading: isLoadingMeets } = useMeets();
  const { data: allEvents, isLoading: isLoadingEvents } = useEvents();

  // --- Local State for Athlete Selection ---
  const [isRelay, setIsRelay] = useState<boolean>(
    currentFormData?.athletes ? currentFormData.athletes.length > 1 : false
  );
  const [selectingAthleteSlot, setSelectingAthleteSlot] = useState<
    number | null
  >(null); // 0 for individual, 0-3 for relay
  const [athleteNames, setAthleteNames] = useState<Record<string, string>>({}); // Map personId -> display name

  // Determine required athletes based on relay state
  const requiredAthletes = isRelay ? 4 : 1;

  // Effect to set initial relay state based on loaded data
  useEffect(() => {
    setIsRelay((currentFormData?.athletes?.length ?? 0) > 1);
  }, [currentFormData?.athletes]);

  // --- Effect to Fetch Athlete Names for Display ---
  const personIdsToFetch = useMemo(() => {
    return getSafeArray(currentFormData?.persons);
  }, [currentFormData?.persons]);

  useEffect(() => {
    if (personIdsToFetch.length > 0) {
      const fetchNames = async () => {
        // Only fetch names we don't already have
        const idsNotInState = personIdsToFetch.filter(
          (id) => id && !(id in athleteNames)
        ); // Ensure ID exists before checking
        if (idsNotInState.length === 0) return;

        console.log(
          '[ResultsForm] Fetching names for Person IDs:',
          idsNotInState
        );
        try {
          const personMap = await fetchChunkedData<Person>(
            idsNotInState,
            'people'
          );
          const newNames: Record<string, string> = {};
          personMap.forEach((person, id) => {
            if (person) {
              const firstName = person.preferredName || person.firstName;
              const lastName = person.lastName;
              newNames[id] =
                `${firstName || ''} ${lastName || ''}`.trim() ||
                `Person ${id.substring(0, 5)}`;
            }
          });
          // Merge new names with existing ones
          setAthleteNames((prev) => ({ ...prev, ...newNames }));
        } catch (fetchError) {
          console.error(
            '[ResultsForm] Failed to fetch person names:',
            fetchError
          );
          // Optionally set an error state or display placeholder names
        }
      };
      fetchNames();
    }
    // If personIdsToFetch becomes empty (e.g., form cleared), clear names
    else if (Object.keys(athleteNames).length > 0) {
      setAthleteNames({});
    }
    // Intentionally limit dependencies: only run when the list of IDs changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personIdsToFetch]); // Keep athleteNames out to prevent loop if fetch fails partially

  // --- Memos for Dropdown Filtering (remain the same) ---
  const isDisabled = mode === 'view' || mode === null || isSaving;

  const availableSeasons = useMemo(() => {
    if (!allSeasons || !currentFormData?.team) return [];
    return allSeasons.filter((season) => season.team === currentFormData.team);
  }, [allSeasons, currentFormData?.team]);

  const availableMeets = useMemo(() => {
    if (!allMeets || !currentFormData?.season) return [];
    return allMeets.filter((meet) => meet.season === currentFormData.season);
  }, [allMeets, currentFormData?.season]);

  const availableEvents = useMemo(() => {
    if (!allEvents || !currentFormData?.meet) return [];
    return allEvents; // Basic: return all events. Implement meet-specific filtering later.
  }, [allEvents, currentFormData?.meet]);

  // --- Event Handlers ---

  // Generic change handlers (remain the same)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    updateFormField(e.target.name, e.target.value);
  };
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue: any = value;
    if (['dq', 'official', 'benchmarks'].includes(name)) {
      finalValue = stringToBool(value);
    }
    if (!['team', 'season', 'meet', 'resultType'].includes(name)) {
      // Added resultType exclusion
      updateFormField(name, finalValue);
    }
  };
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTeamId = e.target.value;
    updateFormField('team', newTeamId);
    updateFormField('season', '');
    updateFormField('meet', '');
    updateFormField('event', '');
    // Also clear athletes when team changes, as they are team/season specific
    updateFormField('athletes', []);
    updateFormField('persons', []);
    setAthleteNames({});
  };
  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeasonId = e.target.value;
    updateFormField('season', newSeasonId);
    updateFormField('meet', '');
    updateFormField('event', '');
    // Also clear athletes when season changes
    updateFormField('athletes', []);
    updateFormField('persons', []);
    setAthleteNames({});
  };
  const handleMeetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMeetId = e.target.value;
    updateFormField('meet', newMeetId);
    updateFormField('event', '');
    // Athletes usually stay the same if only the meet changes within a season
  };
  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFormField('event', e.target.value);
  };

  // Relay Toggle Handler
  const handleRelayToggleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const relaySelected = e.target.value === 'relay';
    setIsRelay(relaySelected);
    // Clear existing athlete/person selections when type changes
    updateFormField('athletes', []);
    updateFormField('persons', []);
    setAthleteNames({}); // Clear displayed names
  };

  // Athlete Modal Handlers
  const handleOpenAthleteModal = (slotIndex: number) => {
    if (isDisabled) return;
    // Ensure team and season are selected before opening modal
    if (!currentFormData?.team || !currentFormData?.season) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Please select a Team and Season before choosing athletes.',
      });
      return;
    }
    if (error) dispatch({ type: 'SET_ERROR', payload: null }); // Clear error if present
    setSelectingAthleteSlot(slotIndex);
  };

  const handleCloseAthleteModal = () => {
    setSelectingAthleteSlot(null);
  };

  // Callback when athlete is selected from modal
  const handleAthleteSelect = useCallback(
    (selection: { athleteId: string; personId: string }) => {
      if (selectingAthleteSlot === null) return; // Should not happen

      // Get current arrays safely
      const currentAthletes = getSafeArray(currentFormData?.athletes);
      const currentPersons = getSafeArray(currentFormData?.persons);

      // Create new arrays - ensure correct length based on relay mode
      const newAthletes = [...currentAthletes];
      const newPersons = [...currentPersons];
      const targetSize = isRelay ? 4 : 1;

      // Resize arrays if needed (e.g., switching from individual to relay might leave short arrays)
      while (newAthletes.length < targetSize) newAthletes.push('');
      while (newPersons.length < targetSize) newPersons.push('');

      // Update the specific slot
      newAthletes[selectingAthleteSlot] = selection.athleteId;
      newPersons[selectingAthleteSlot] = selection.personId;

      // Update FormContext state
      updateFormField('athletes', newAthletes.slice(0, targetSize)); // Ensure array has correct final size
      updateFormField('persons', newPersons.slice(0, targetSize));

      // Fetch the name for the newly selected person immediately if not already fetched
      if (!(selection.personId in athleteNames)) {
        fetchChunkedData<Person>([selection.personId], 'people').then(
          (personMap) => {
            const person = personMap.get(selection.personId);
            if (person) {
              const firstName = person.preferredName || person.firstName;
              const lastName = person.lastName;
              setAthleteNames((prev) => ({
                ...prev,
                [selection.personId]:
                  `${firstName || ''} ${lastName || ''}`.trim() ||
                  `Person ${selection.personId.substring(0, 5)}`,
              }));
            }
          }
        );
      }

      handleCloseAthleteModal(); // Close modal after selection
      // Add dependencies for useCallback
    },
    [
      selectingAthleteSlot,
      currentFormData?.athletes,
      currentFormData?.persons,
      isRelay,
      updateFormField,
      athleteNames,
    ]
  );

  // --- Action Handlers (Edit, Cancel, Delete - remain the same) ---
  const handleEditClick = () => {
    if (selectedItem?.type === 'result' && selectedItem?.id) {
      selectItemForForm(selectedItem.type, selectedItem.id, 'edit');
    }
  };
  const handleCancelClick = () => {
    if (selectedItem?.mode === 'add') {
      clearForm();
    } else if (selectedItem?.type === 'result' && selectedItem?.id) {
      revertFormData();
      selectItemForForm(selectedItem.type, selectedItem.id, 'view');
    }
  };
  const handleDeleteClick = async () => {
    if (isSaving || !selectedItem?.id) return;
    if (window.confirm(`Are you sure you want to delete this result?`)) {
      await deleteItem();
    }
  };

  // --- SAVE Handler (Updated Validation) ---
  const handleSaveClick = async () => {
    if (isSaving || !currentFormData) return;

    const currentAthletes = getSafeArray(currentFormData?.athletes);
    const currentPersons = getSafeArray(currentFormData?.persons); // Ensure persons are also checked

    // --- Validation ---
    const athletesPopulated = currentAthletes.filter(Boolean).length; // Count non-empty IDs
    const personsPopulated = currentPersons.filter(Boolean).length; // Count non-empty person IDs
    let validationError: string | null = null;

    if (!currentFormData.team) validationError = 'Team is required.';
    else if (!currentFormData.season) validationError = 'Season is required.';
    else if (!currentFormData.meet) validationError = 'Meet is required.';
    else if (!currentFormData.event) validationError = 'Event is required.';
    else if (!currentFormData.result)
      validationError = 'Result Time is required.';
    // Ensure both athletes and persons arrays are correctly populated
    else if (
      athletesPopulated !== requiredAthletes ||
      personsPopulated !== requiredAthletes
    ) {
      validationError = `Requires exactly ${requiredAthletes} athlete(s) selected. Found ${athletesPopulated} athletes and ${personsPopulated} persons.`;
    }
    // Add time format validation later

    if (validationError) {
      dispatch({ type: 'SET_ERROR', payload: validationError });
      return;
    }

    if (error) {
      dispatch({ type: 'SET_ERROR', payload: null }); // Clear previous errors
    }

    // --- TODO LATER: Convert time string to number ---
    // const numericResult = timeStringToHundredths(currentFormData.result as string);
    // if (numericResult === null) { /* Handle invalid time */ return; }
    // const dataToSave = { ...currentFormData, result: numericResult, athletes: currentAthletes, persons: currentPersons };
    // await saveForm(dataToSave); // Modify saveForm if needed or prepare data here

    // For now, save with string time and potentially incomplete/incorrect athlete arrays
    await saveForm();

    // Persistence logic will be added later via useEffect watching `isSaving`
  };

  // --- Render ---
  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        {/* --- Context Section (Team, Season, Meet, Event) --- */}
        <section>
          <p>Context</p>
          <div className="field">
            <label htmlFor="team">Team *</label>
            <select
              id="team"
              name="team"
              value={currentFormData?.team ?? ''}
              onChange={handleTeamChange}
              disabled={isDisabled || isLoadingTeams}
              required
            >
              <option value="" disabled>
                {isLoadingTeams ? 'Loading...' : '-- Select Team --'}
              </option>
              {teams?.map((team: Team) => (
                <option key={team.id} value={team.id}>
                  {team.code} - {team.nameShort}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="season">Season *</label>
            <select
              id="season"
              name="season"
              value={currentFormData?.season ?? ''}
              onChange={handleSeasonChange}
              disabled={
                !currentFormData?.team || isDisabled || isLoadingSeasons
              }
              required
            >
              <option value="" disabled>
                {isLoadingSeasons
                  ? 'Loading...'
                  : !currentFormData?.team
                    ? 'Select Team First'
                    : '-- Select Season --'}
              </option>
              {availableSeasons.map((season: SeasonWithTeamInfo) => (
                <option key={season.id} value={season.id}>
                  {season.season ?? '?'} {season.year ?? '?'}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="meet">Meet *</label>
            <select
              id="meet"
              name="meet"
              value={currentFormData?.meet ?? ''}
              onChange={handleMeetChange}
              disabled={
                !currentFormData?.season || isDisabled || isLoadingMeets
              }
              required
            >
              <option value="" disabled>
                {isLoadingMeets
                  ? 'Loading...'
                  : !currentFormData?.season
                    ? 'Select Season First'
                    : '-- Select Meet --'}
              </option>
              {availableMeets.map((meet: MeetWithContextInfo) => (
                <option key={meet.id} value={meet.id}>
                  {meet.nameShort ?? 'Unknown Meet'} ({meet.date ?? 'No Date'})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="event">Event *</label>
            <select
              id="event"
              name="event"
              value={currentFormData?.event ?? ''}
              onChange={handleEventChange}
              disabled={!currentFormData?.meet || isDisabled || isLoadingEvents}
              required
            >
              <option value="" disabled>
                {isLoadingEvents
                  ? 'Loading...'
                  : !currentFormData?.meet
                    ? 'Select Meet First'
                    : '-- Select Event --'}
              </option>
              {availableEvents.map((event: Event) => (
                <option
                  key={event.id}
                  value={event.id}
                >{`${event.distance || '?'} ${event.stroke || '?'} ${event.course || '?'}`}</option>
              ))}
            </select>
          </div>
        </section>

        {/* --- Athlete Selection Section --- */}
        <section>
          <p>Athlete(s) *</p>
          {/* Individual / Relay Toggle */}
          <div className="field">
            <label htmlFor="resultType">Type</label>
            <select
              id="resultType"
              name="resultType" // Name matches the select element, not a form field directly
              value={isRelay ? 'relay' : 'individual'}
              onChange={handleRelayToggleChange}
              disabled={isDisabled}
            >
              <option value="individual">Individual</option>
              <option value="relay">Relay</option>
            </select>
          </div>

          {/* Athlete Slots */}
          <div className="athlete-slots-container">
            {Array.from({ length: requiredAthletes }).map((_, index) => {
              // Safely access IDs from potentially sparse arrays
              const personId =
                getSafeArray(currentFormData?.persons)[index] || null;
              const athleteId =
                getSafeArray(currentFormData?.athletes)[index] || null;
              // Determine display name, handle loading/missing cases
              const displayName = personId
                ? athleteNames[personId] || 'Loading...'
                : 'None Selected';

              return (
                <div className="field athlete-slot" key={index}>
                  <label htmlFor={`athlete-slot-${index}`}>
                    {isRelay ? `Leg ${index + 1}` : 'Athlete'}
                  </label>
                  <div className="athlete-display-container">
                    <span
                      id={`athlete-slot-${index}`}
                      className="athlete-display-name"
                    >
                      {displayName}
                    </span>
                    {mode !== 'view' && (
                      <button
                        type="button"
                        className="button-change-athlete"
                        onClick={() => handleOpenAthleteModal(index)}
                        disabled={isDisabled}
                        aria-label={
                          athleteId
                            ? `Change Athlete ${isRelay ? `Leg ${index + 1}` : ''}`
                            : `Select Athlete ${isRelay ? `Leg ${index + 1}` : ''}`
                        }
                      >
                        {athleteId ? 'Change' : 'Select'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Show hint if not enough athletes are selected and not in view mode */}
          {getSafeArray(currentFormData?.athletes).filter(Boolean).length !==
            requiredAthletes &&
            mode !== 'view' && (
              <p className="field-hint subtle">Selection required.</p>
            )}
        </section>

        {/* --- Result Details Section --- */}
        <section>
          <p>Result Details</p>
          <div className="field">
            <label htmlFor="result">Time *</label>
            <input
              type="text"
              id="result"
              name="result"
              placeholder="e.g., 1:05.32 or 28.91"
              value={currentFormData?.result ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="dq">DQ?</label>
            <select
              id="dq"
              name="dq"
              value={boolToString(currentFormData?.dq)}
              onChange={handleSelectChange}
              disabled={isDisabled}
            >
              <option value="">--</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="official">Official?</label>
            <select
              id="official"
              name="official"
              value={boolToString(currentFormData?.official)}
              onChange={handleSelectChange}
              disabled={isDisabled}
            >
              <option value="">--</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="benchmarks">Benchmarks?</label>
            <select
              id="benchmarks"
              name="benchmarks"
              value={boolToString(currentFormData?.benchmarks)}
              onChange={handleSelectChange}
              disabled={isDisabled}
            >
              <option value="">--</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </section>

        {/* --- Actions Section --- */}
        <section>
          <p>Actions</p>
          {error && <div className="form-message error">{error}</div>}
          <div className="buttons">
            {mode === 'view' && selectedItem?.id && (
              <button type="button" onClick={handleEditClick}>
                {' '}
                Edit{' '}
              </button>
            )}
            {(mode === 'edit' || mode === 'add') && (
              <>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={isSaving}
                >
                  {' '}
                  {isSaving ? 'Saving...' : 'Save'}{' '}
                </button>
                <button
                  type="button"
                  onClick={handleCancelClick}
                  disabled={isSaving}
                >
                  {' '}
                  Cancel{' '}
                </button>
              </>
            )}
            {mode === 'edit' && selectedItem?.id && (
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={isSaving}
                className="delete"
              >
                {' '}
                {isSaving ? 'Deleting...' : 'Delete'}{' '}
              </button>
            )}
          </div>
        </section>

        {/* --- Timestamps Section --- */}
        {(currentFormData?.createdAt || currentFormData?.updatedAt) && (
          <section className="form-timestamps">
            {currentFormData.createdAt && (
              <p>Created: {formatTimestamp(currentFormData.createdAt)}</p>
            )}
            {currentFormData.updatedAt && (
              <p>Updated: {formatTimestamp(currentFormData.updatedAt)}</p>
            )}
          </section>
        )}
      </form>

      {/* --- Modal Rendering --- */}
      <AthleteSelectorModal
        isOpen={selectingAthleteSlot !== null}
        onClose={handleCloseAthleteModal}
        onSelect={handleAthleteSelect}
        // Pass selected team/season for filtering athletes within the modal
        teamId={currentFormData?.team || null}
        seasonId={currentFormData?.season || null}
        // Optional: Prevent selecting already chosen athletes in the relay
        excludeIds={
          isRelay
            ? getSafeArray(currentFormData?.athletes).filter(
                (id, index) => id && index !== selectingAthleteSlot
              )
            : []
        }
      />
    </div>
  );
};

export default ResultsForm;
