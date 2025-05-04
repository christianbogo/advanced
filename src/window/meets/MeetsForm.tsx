// src/window/meets/MeetsForm.tsx

import React, { useMemo, useState } from 'react'; // Added useState
import { useFormContext, FormMode } from '../../form/FormContext';
import { Meet, Team, Event } from '../../models/index'; // Added Event
// Hooks
import { useTeams } from '../teams/useTeams'; // Assuming useTeams fetches all teams needed
import { useSeasons, SeasonWithTeamInfo } from '../seasons/useSeasons'; // Used to filter seasons based on selected team
import { useEvents } from '../events/useEvents'; // Import the hook to fetch events (adjust path if needed)

import { Timestamp } from 'firebase/firestore';
import '../../styles/form.css'; // Ensure CSS path is correct

// Define the expected props (no change)
interface MeetsFormProps {
  formData: Partial<
    Meet & { createdAt?: Timestamp; updatedAt?: Timestamp }
  > | null;
  mode: FormMode;
}

// Helper functions (formatTimestamp, boolToString, stringToBool remain the same)
const formatTimestamp = (timestamp: Timestamp | undefined | null): string => {
  if (timestamp && timestamp instanceof Timestamp) {
    return timestamp.toDate().toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  return 'N/A';
};
const boolToString = (value: boolean | undefined | null): string => {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return '';
};
const stringToBool = (value: string): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

function MeetsForm({ formData, mode }: MeetsFormProps) {
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
  const { selectedItem, isSaving, error, formData: currentFormData } = state; // Get current form data from context state directly for filtering

  // Data fetching hooks
  const { data: teams, isLoading: isLoadingTeams } = useTeams();
  const { data: allSeasons, isLoading: isLoadingSeasons } = useSeasons();
  const {
    data: allEvents,
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useEvents(); // Fetch events
  console.log('[MeetsForm Debug] Events Hook:', {
    isLoadingEvents,
    eventsError,
    eventCount: allEvents?.length,
    allEvents,
  });

  // Local state for the event order section
  const [selectedEventToAdd, setSelectedEventToAdd] = useState<string>('');

  // --- Memos ---
  const isDisabled = mode === 'view' || mode === null || isSaving;

  // Filter seasons based on the currently selected team in the form data
  const availableSeasons = useMemo(() => {
    if (!allSeasons || !currentFormData?.team) {
      return []; // Return empty if no seasons loaded or no team selected in form
    }
    // Filter the seasons fetched by useSeasons
    return allSeasons.filter((season) => season.team === currentFormData.team);
  }, [allSeasons, currentFormData?.team]); // Re-filter when seasons load or form's team changes

  // Create a map for quick event lookup by ID
  const eventMap = useMemo(() => {
    if (!allEvents) return new Map<string, Event>();
    return new Map<string, Event>(
      allEvents.map((event: Event) => [event.id, event])
    );
  }, [allEvents]);

  // Get current event order or default to empty array
  const currentEventOrder: string[] = useMemo(
    () => currentFormData?.eventOrder ?? [],
    [currentFormData?.eventOrder]
  );

  // --- Event Handlers ---

  // Generic handler for text/date input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    updateFormField(name, value);
  };

  // Specific handler for MOST select elements (including boolean conversions)
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue: any = value;

    if (['official', 'benchmarks', 'dataComplete'].includes(name)) {
      finalValue = stringToBool(value);
    }
    // DO NOT handle 'team' or 'season' or 'eventToAdd' here - use specific handlers
    if (name !== 'team' && name !== 'season' && name !== 'eventToAdd') {
      updateFormField(name, finalValue);
    }
  };

  // Handler for TEAM selection change
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTeamId = e.target.value;
    updateFormField('team', newTeamId);

    // IMPORTANT: If the currently selected season doesn't belong to the new team, clear it
    const currentSeasonId = currentFormData?.season;
    if (currentSeasonId) {
      const seasonBelongsToNewTeam =
        allSeasons?.find((s) => s.id === currentSeasonId)?.team === newTeamId;
      if (!seasonBelongsToNewTeam) {
        console.log(
          "Clearing season selection as it doesn't belong to the new team."
        );
        updateFormField('season', ''); // Clear season selection
      }
    }
  };

  // Handler for SEASON selection change
  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeasonId = e.target.value;
    updateFormField('season', newSeasonId);
  };

  // --- Event Order Handlers ---
  const handleSelectedEventChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedEventToAdd(e.target.value);
  };

  const handleAddEvent = () => {
    if (!selectedEventToAdd || currentEventOrder.includes(selectedEventToAdd)) {
      return; // Don't add if nothing selected or already exists
    }
    const newEventOrder = [...currentEventOrder, selectedEventToAdd];
    updateFormField('eventOrder', newEventOrder);
    setSelectedEventToAdd(''); // Reset dropdown
  };

  const handleRemoveEvent = (indexToRemove: number) => {
    const newEventOrder = currentEventOrder.filter(
      (_, index) => index !== indexToRemove
    );
    updateFormField('eventOrder', newEventOrder);
  };

  const handleMoveEvent = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentEventOrder.length) {
      return; // Cannot move outside bounds
    }
    const newEventOrder = [...currentEventOrder];
    // Swap elements: Array destructuring for swap
    [newEventOrder[index], newEventOrder[newIndex]] = [
      newEventOrder[newIndex],
      newEventOrder[index],
    ];
    updateFormField('eventOrder', newEventOrder);
  };

  // --- Action Handlers (Edit, Cancel, Delete) ---
  const handleEditClick = () => {
    if (selectedItem?.type === 'meet' && selectedItem?.id) {
      selectItemForForm(selectedItem.type, selectedItem.id, 'edit');
    }
  };

  const handleCancelClick = () => {
    if (selectedItem?.mode === 'add') {
      clearForm();
    } else if (selectedItem?.type === 'meet' && selectedItem?.id) {
      revertFormData();
      selectItemForForm(selectedItem.type, selectedItem.id, 'view');
    }
  };

  const handleDeleteClick = async () => {
    if (isSaving) return;
    await deleteItem(); // Confirmation is usually handled within deleteItem in context
  };

  // --- SAVE Handler ---
  const handleSaveClick = async () => {
    if (isSaving || !currentFormData) return;

    // Basic Validation: Check required fields
    if (
      !currentFormData.nameShort ||
      !currentFormData.nameLong ||
      !currentFormData.team ||
      !currentFormData.season ||
      !currentFormData.date
    ) {
      // Dispatch error to be shown in the form
      dispatch({
        type: 'SET_ERROR',
        payload:
          'Please fill in all required fields (Short Name, Long Name, Team, Season, Date).',
      });
      return; // Prevent saving
    }

    // Clear any previous errors on successful validation before saving attempt
    if (error) {
      dispatch({ type: 'SET_ERROR', payload: null });
    }

    // The eventOrder field is already up-to-date in the context state
    // due to handleAddEvent, handleRemoveEvent, handleMoveEvent calling updateFormField.
    await saveForm();
  };

  // --- Render ---
  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        {/* --- Meet Details Section --- */}
        <section>
          <p>Meet Details</p>
          <div className="field">
            <label htmlFor="nameShort">Short Name</label>
            <input
              type="text"
              id="nameShort"
              name="nameShort"
              placeholder=""
              value={currentFormData?.nameShort ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="nameLong">Long Name</label>
            <input
              type="text"
              id="nameLong"
              name="nameLong"
              placeholder=""
              value={currentFormData?.nameLong ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="team">Team</label>
            <select
              id="team"
              name="team"
              value={currentFormData?.team ?? ''}
              onChange={handleTeamChange}
              disabled={isDisabled || isLoadingTeams}
              required
            >
              <option value="" disabled>
                {' '}
                {isLoadingTeams ? 'Loading...' : ''}{' '}
              </option>
              {teams?.map((team: Team) => (
                <option key={team.id} value={team.id}>
                  {' '}
                  {team.code} - {team.nameShort}{' '}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="season">Season</label>
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
                {' '}
                {isLoadingSeasons
                  ? 'Loading...'
                  : currentFormData?.team
                    ? ''
                    : 'Select Team'}{' '}
              </option>
              {availableSeasons.map((season: SeasonWithTeamInfo) => (
                <option key={season.id} value={season.id}>
                  {' '}
                  {season.season ?? ''} {season.year ?? ''}{' '}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* --- Date & Location Section --- */}
        <section>
          <p>Date & Location</p>
          <div className="field">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={currentFormData?.date ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="location">Location Name</label>
            <input
              type="text"
              id="location"
              name="location"
              placeholder=""
              value={currentFormData?.location ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
            />
          </div>
          <div className="field">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              placeholder=""
              value={currentFormData?.address ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
            />
          </div>
        </section>

        {/* === Event Order Section === */}
        <section>
          <p>Event Order</p>
          <div className="add-event-control field">
            <select
              id="eventToAdd"
              name="eventToAdd"
              value={selectedEventToAdd}
              onChange={handleSelectedEventChange}
              disabled={isDisabled || isLoadingEvents}
            >
              <option value="" disabled>
                {' '}
                {isLoadingEvents ? 'Loading...' : ''}{' '}
              </option>
              {allEvents?.map((event: Event) => (
                <option
                  key={event.id}
                  value={event.id}
                  disabled={currentEventOrder.includes(event.id)}
                >
                  {`${event.distance} ${event.course} ${event.stroke}`}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-add-event"
              onClick={handleAddEvent}
              disabled={
                !selectedEventToAdd ||
                currentEventOrder.includes(selectedEventToAdd) ||
                isDisabled
              }
            >
              {' '}
              Add{' '}
            </button>
          </div>

          <ol className="event-order-list">
            {currentEventOrder.length === 0 && !isDisabled && (
              <li className="empty-message">No events added yet.</li>
            )}
            {currentEventOrder.map((eventId, index) => {
              const event = eventMap.get(eventId);
              const canMoveUp = index > 0;
              const canMoveDown = index < currentEventOrder.length - 1;

              return (
                <li key={`${eventId}-${index}`} className="event-order-item">
                  <span className="event-order-number">{index + 1}.</span>
                  <span className="details">
                    {event
                      ? `${event.distance} ${event.course} ${event.stroke}`
                      : `Unknown Event (ID: ${eventId})`}
                  </span>
                  <span className="controls">
                    <button
                      type="button"
                      className="btn-move-event"
                      onClick={() => handleMoveEvent(index, -1)}
                      disabled={!canMoveUp || isDisabled}
                      aria-label="Move event up"
                    >
                      {' '}
                      &uarr;{' '}
                    </button>
                    <button
                      type="button"
                      className="btn-move-event"
                      onClick={() => handleMoveEvent(index, 1)}
                      disabled={!canMoveDown || isDisabled}
                      aria-label="Move event down"
                    >
                      {' '}
                      &darr;{' '}
                    </button>
                    <button
                      type="button"
                      className="btn-remove-event"
                      onClick={() => handleRemoveEvent(index)}
                      disabled={isDisabled}
                      aria-label="Remove event"
                    >
                      {' '}
                      &times;{' '}
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* --- Settings & Status Section --- */}
        <section>
          <p>Settings & Status</p>
          <div className="field">
            <label htmlFor="official">Official Meet?</label>
            <select
              id="official"
              name="official"
              value={boolToString(currentFormData?.official)}
              onChange={handleSelectChange}
              disabled={isDisabled}
            >
              <option value="" disabled></option>{' '}
              <option value="true">Yes</option>{' '}
              <option value="false">No</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="benchmarks">Benchmark Meet?</label>
            <select
              id="benchmarks"
              name="benchmarks"
              value={boolToString(currentFormData?.benchmarks)}
              onChange={handleSelectChange}
              disabled={isDisabled}
            >
              <option value="" disabled></option>{' '}
              <option value="true">Yes</option>{' '}
              <option value="false">No</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="dataComplete">Data Complete?</label>
            <select
              id="dataComplete"
              name="dataComplete"
              value={boolToString(currentFormData?.dataComplete)}
              onChange={handleSelectChange}
              disabled={isDisabled}
            >
              <option value="" disabled></option>{' '}
              <option value="true">Yes</option>{' '}
              <option value="false">No</option>
            </select>
          </div>
        </section>

        {/* --- Action Buttons Section --- */}
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
    </div>
  );
}

export default MeetsForm;
