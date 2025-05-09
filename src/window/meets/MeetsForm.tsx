import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useFormContext, FormMode } from '../../form/FormContext';
import { Meet, Team, Season, Event } from '../../types/data'; // Assuming Event is correctly typed
import { useTeams } from '../teams/useTeams';
import { useSeasons } from '../seasons/useSeasons';
import { useEvents } from '../events/useEvents';
import { Timestamp } from 'firebase/firestore';
import '../../styles/form.css';

interface MeetsFormProps {
  formData: Partial<Meet> | null; // initialFormData might have eventOrder as string[]
  mode: FormMode;
}

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

function MeetsForm({ formData: initialFormData, mode }: MeetsFormProps) {
  const {
    state,
    dispatch,
    updateFormField,
    selectItemForForm,
    saveForm, // Crucial: This function will ideally handle dehydration
    clearForm,
    revertFormData,
    deleteItem,
  } = useFormContext();
  const { selectedItem, isSaving, error, formData: currentFormData } = state; // currentFormData.eventOrder might be string[] or Event[]

  const { data: teamsData, isLoading: isLoadingTeams } = useTeams();
  const { data: allSeasonsData, isLoading: isLoadingSeasons } = useSeasons();
  const { data: allEventsData, isLoading: isLoadingEvents } = useEvents(); // Source for Event objects

  const [selectedTeamIdForFiltering, setSelectedTeamIdForFiltering] =
    useState<string>('');
  const [selectedEventToAdd, setSelectedEventToAdd] = useState<string>(''); // This will store the ID of the event to add
  const isDisabled = mode === 'view' || mode === null || isSaving;

  const initializedForMeetIdRef = useRef<string | null>(null);
  const initializedForModeRef = useRef<FormMode | null>(null);

  useEffect(() => {
    const currentMeetId = initialFormData?.id ?? null;
    let needsReinitialization = false;
    if (
      initializedForModeRef.current === null &&
      initializedForMeetIdRef.current === null
    ) {
      needsReinitialization = true;
    } else if (mode !== initializedForModeRef.current) {
      needsReinitialization = true;
    } else if (currentMeetId !== initializedForMeetIdRef.current) {
      needsReinitialization = true;
    }

    if (needsReinitialization) {
      if (mode === 'edit' || mode === 'view') {
        const teamIdFromInitialSeason = (
          initialFormData?.season as Season | undefined
        )?.team?.id;
        setSelectedTeamIdForFiltering(teamIdFromInitialSeason ?? '');
      } else {
        setSelectedTeamIdForFiltering('');
      }
      initializedForMeetIdRef.current = currentMeetId;
      initializedForModeRef.current = mode;
    }
  }, [initialFormData, mode]);

  const availableSeasons = useMemo(() => {
    // ... (no changes needed here)
    if (!allSeasonsData || !selectedTeamIdForFiltering) {
      return [];
    }
    return allSeasonsData.filter(
      (season) => season.team.id === selectedTeamIdForFiltering
    );
  }, [allSeasonsData, selectedTeamIdForFiltering]);

  // Map of all available events by their ID for quick lookup
  const eventMap = useMemo(() => {
    if (!allEventsData) return new Map<string, Event>();
    return new Map<string, Event>(
      allEventsData.map((event: Event) => [event.id, event])
    );
  }, [allEventsData]);

  // This will be our primary array of Event objects for UI manipulation
  const hydratedEventOrder: Event[] = useMemo(() => {
    const orderSource = currentFormData?.eventOrder; // Could be string[] or already Event[]

    if (!orderSource || !eventMap.size) {
      return []; // No source data or no events to map with
    }

    // If the first item is an object with an 'id' property, assume it's already Event[]
    if (
      orderSource.length > 0 &&
      typeof orderSource[0] === 'object' &&
      orderSource[0] !== null &&
      'id' in orderSource[0]
    ) {
      return orderSource as Event[];
    }

    // If the first item is a string, assume it's string[] and needs hydration
    if (orderSource.length > 0 && typeof orderSource[0] === 'string') {
      return (orderSource as string[])
        .map((eventId) => eventMap.get(eventId))
        .filter((event): event is Event => event !== undefined); // Filter out any undefined if an ID wasn't found
    }

    return []; // Default to empty if not matching expected structures
  }, [currentFormData?.eventOrder, eventMap]);

  const handleTextFieldChange = useCallback(
    // ... (no changes needed here)
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      updateFormField(name as keyof Meet, value);
    },
    [updateFormField]
  );

  const handleBooleanSelectChange = useCallback(
    // ... (no changes needed here)
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      updateFormField(name as keyof Meet, stringToBool(value));
    },
    [updateFormField]
  );

  const handleTeamChange = useCallback(
    // ... (no changes needed here)
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newSelectedTeamId = event.target.value;
      setSelectedTeamIdForFiltering(newSelectedTeamId);
      updateFormField('season', null);
    },
    [updateFormField]
  );

  const handleSeasonChange = useCallback(
    // ... (no changes needed here)
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedSeasonId = event.target.value;
      const seasonObject = availableSeasons?.find(
        (s) => s.id === selectedSeasonId
      );
      updateFormField('season', seasonObject ?? null);
    },
    [availableSeasons, updateFormField]
  );

  const handleSelectedEventChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedEventToAdd(e.target.value); // Value is the event ID string
  };

  const handleAddEvent = useCallback(() => {
    if (!selectedEventToAdd) return; // selectedEventToAdd is the ID string

    const eventObjectToAdd = eventMap.get(selectedEventToAdd);
    if (!eventObjectToAdd) {
      console.warn('Event not found in map:', selectedEventToAdd);
      return;
    }

    // Check if event (by ID) is already in the hydratedEventOrder
    if (hydratedEventOrder.some((event) => event.id === selectedEventToAdd)) {
      return; // Event already exists
    }

    const newEventOrderWithObjects = [...hydratedEventOrder, eventObjectToAdd];
    updateFormField('eventOrder', newEventOrderWithObjects); // Update context with Event[]
    setSelectedEventToAdd('');
  }, [hydratedEventOrder, selectedEventToAdd, eventMap, updateFormField]);

  const handleRemoveEvent = useCallback(
    (indexToRemove: number) => {
      const newEventOrderWithObjects = hydratedEventOrder.filter(
        (_, index) => index !== indexToRemove
      );
      updateFormField('eventOrder', newEventOrderWithObjects); // Update context with Event[]
    },
    [hydratedEventOrder, updateFormField]
  );

  const handleMoveEvent = useCallback(
    (index: number, direction: -1 | 1) => {
      if (hydratedEventOrder.length === 0) return;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= hydratedEventOrder.length) return;

      const newEventOrderWithObjects = [...hydratedEventOrder];
      [newEventOrderWithObjects[index], newEventOrderWithObjects[newIndex]] = [
        newEventOrderWithObjects[newIndex],
        newEventOrderWithObjects[index],
      ];
      updateFormField('eventOrder', newEventOrderWithObjects); // Update context with Event[]
    },
    [hydratedEventOrder, updateFormField]
  );
  const handleEditClick = useCallback(() => {
    if (selectedItem?.type === 'meet' && selectedItem?.id) {
      selectItemForForm(selectedItem.type, selectedItem.id, 'edit');
    }
  }, [selectedItem, selectItemForForm]);

  const handleCancelClick = useCallback(() => {
    if (selectedItem?.mode === 'add') {
      clearForm();
    } else if (selectedItem?.type === 'meet' && selectedItem?.id) {
      revertFormData();
      selectItemForForm(selectedItem.type, selectedItem.id, 'view');
    }
  }, [selectedItem, clearForm, revertFormData, selectItemForForm]);

  const handleDeleteClick = useCallback(async () => {
    // ... (no changes)
    if (isSaving) return;
    await deleteItem();
  }, [isSaving, deleteItem]);

  // IMPORTANT: Dehydration for Save
  // The ideal place for dehydration (Event[] -> string[]) is within the FormContext's saveForm method.
  // If FormContext.saveForm is responsible for this, handleSaveClick becomes simpler.
  // If MeetsForm must do it because FormContext.saveForm is generic, then you'd transform here.
  const handleSaveClick = useCallback(async () => {
    if (isSaving || !currentFormData) return;

    const currentSeason = currentFormData.season as Season | undefined;
    if (
      !currentFormData.nameShort ||
      !currentFormData.nameLong ||
      !currentSeason?.id ||
      !currentFormData.date
    ) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          'Please fill in all required fields (Short Name, Long Name, Team, Season, Date).',
      });
      return;
    }
    if (error) dispatch({ type: 'SET_ERROR', payload: null });

    await saveForm();
  }, [isSaving, currentFormData, saveForm, dispatch, error]);

  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        {/* ... (Team and Season dropdowns - no changes) ... */}
        <section>
          <p className="form-section-title">Meet Details</p>
          {/* ... nameShort, nameLong, team, season fields ... */}
          <div className="field">
            <label htmlFor="nameShort">Short Name</label>
            <input
              type="text"
              id="nameShort"
              name="nameShort"
              value={currentFormData?.nameShort ?? ''}
              onChange={handleTextFieldChange}
              readOnly={isDisabled}
              required
              aria-required="true"
            />
          </div>
          <div className="field">
            <label htmlFor="nameLong">Long Name</label>
            <input
              type="text"
              id="nameLong"
              name="nameLong"
              value={currentFormData?.nameLong ?? ''}
              onChange={handleTextFieldChange}
              readOnly={isDisabled}
              required
              aria-required="true"
            />
          </div>
          <div className="field">
            <label htmlFor="team">Team</label>
            <select
              id="team"
              name="team"
              value={selectedTeamIdForFiltering}
              onChange={handleTeamChange}
              disabled={isDisabled || isLoadingTeams}
              required
              aria-required="true"
            >
              <option value="" disabled>
                {isLoadingTeams ? 'Loading teams...' : 'Select a Team'}
              </option>
              {teamsData?.map((team: Team) => (
                <option key={team.id} value={team.id}>
                  {team.code} - {team.nameShort}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="season">Season</label>
            <select
              id="season"
              name="season"
              value={(currentFormData?.season as Season | undefined)?.id ?? ''}
              onChange={handleSeasonChange}
              disabled={
                !selectedTeamIdForFiltering || isDisabled || isLoadingSeasons
              }
              required
              aria-required="true"
            >
              <option value="" disabled>
                {isLoadingSeasons
                  ? 'Loading seasons...'
                  : selectedTeamIdForFiltering
                    ? 'Select a Season'
                    : 'Select Team First'}
              </option>
              {availableSeasons.map((season: Season) => (
                <option key={season.id} value={season.id}>
                  {season.quarter ?? ''} {season.year ?? ''}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* ... (Date & Location section - no changes) ... */}
        <section>
          <p className="form-section-title">Date & Location</p>
          {/* ... date, location, address fields ... */}
          <div className="field">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={currentFormData?.date ?? ''}
              onChange={handleTextFieldChange}
              readOnly={isDisabled}
              required
              aria-required="true"
            />
          </div>
          <div className="field">
            <label htmlFor="location">Location Name</label>
            <input
              type="text"
              id="location"
              name="location"
              value={currentFormData?.location ?? ''}
              onChange={handleTextFieldChange}
              readOnly={isDisabled}
            />
          </div>
          <div className="field">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={currentFormData?.address ?? ''}
              onChange={handleTextFieldChange}
              readOnly={isDisabled}
            />
          </div>
        </section>

        <section>
          <p className="form-section-title">Event Order</p>
          <div className="add-event-control field">
            <select
              id="eventToAdd"
              name="eventToAdd"
              value={selectedEventToAdd} // This is the event ID string
              onChange={handleSelectedEventChange}
              disabled={isDisabled || isLoadingEvents}
            >
              <option value="" disabled>
                {isLoadingEvents ? 'Loading events...' : 'Select an Event'}
              </option>
              {allEventsData?.map((event: Event) => (
                <option
                  key={event.id}
                  value={event.id} // Value is event ID
                  disabled={hydratedEventOrder.some((e) => e.id === event.id)} // Check against hydrated list
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
                hydratedEventOrder.some((e) => e.id === selectedEventToAdd) || // Check against hydrated list
                isDisabled
              }
            >
              Add
            </button>
          </div>
          <ol className="event-order-list">
            {hydratedEventOrder.length === 0 && !isDisabled && (
              <li className="empty-message">No events added yet.</li>
            )}
            {hydratedEventOrder.map((event, index) => {
              // event is now a full Event object
              const canMoveUp = index > 0;
              const canMoveDown = index < hydratedEventOrder.length - 1;
              return (
                <li key={`${event.id}-${index}`} className="event-order-item">
                  {' '}
                  {/* Unique key using event.id */}
                  <span className="event-order-number">{index + 1}.</span>
                  <span className="details">
                    {/* Directly use properties from the event object */}
                    {`${event.distance} ${event.course} ${event.stroke}`}
                  </span>
                  <span className="controls">
                    <button
                      type="button"
                      className="btn-move-event"
                      onClick={() => handleMoveEvent(index, -1)}
                      disabled={!canMoveUp || isDisabled}
                      aria-label="Move event up"
                    >
                      &uarr;
                    </button>
                    <button
                      type="button"
                      className="btn-move-event"
                      onClick={() => handleMoveEvent(index, 1)}
                      disabled={!canMoveDown || isDisabled}
                      aria-label="Move event down"
                    >
                      &darr;
                    </button>
                    <button
                      type="button"
                      className="btn-remove-event"
                      onClick={() => handleRemoveEvent(index)}
                      disabled={isDisabled}
                      aria-label="Remove event"
                    >
                      &times;
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ... (Settings & Status, Actions, Timestamps sections - no changes needed in their structure due to this) ... */}
        <section>
          <p className="form-section-title">Settings & Status</p>
          {/* ... official, benchmarks, dataComplete fields ... */}
          <div className="field">
            <label htmlFor="official">Official Meet?</label>
            <select
              id="official"
              name="official"
              value={boolToString(currentFormData?.official)}
              onChange={handleBooleanSelectChange}
              disabled={isDisabled}
            >
              <option value="" disabled></option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="benchmarks">Benchmark Meet?</label>
            <select
              id="benchmarks"
              name="benchmarks"
              value={boolToString(currentFormData?.benchmarks)}
              onChange={handleBooleanSelectChange}
              disabled={isDisabled}
            >
              <option value="" disabled></option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="dataComplete">Data Complete?</label>
            <select
              id="dataComplete"
              name="dataComplete"
              value={boolToString(currentFormData?.dataComplete)}
              onChange={handleBooleanSelectChange}
              disabled={isDisabled}
            >
              <option value="" disabled></option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </section>

        <section>
          <p className="form-section-title">Actions</p>
          {error && <div className="form-message error">{error}</div>}
          {/* ... buttons ... */}
          <div className="buttons">
            {mode === 'view' && selectedItem?.id && (
              <button type="button" onClick={handleEditClick}>
                Edit
              </button>
            )}
            {(mode === 'edit' || mode === 'add') && (
              <>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  className="primary"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelClick}
                  disabled={isSaving}
                >
                  Cancel
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
                {isSaving ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </section>

        {(currentFormData?.createdAt || currentFormData?.updatedAt) && (
          <section className="form-timestamps">
            {/* ... timestamps ... */}
            {currentFormData.createdAt && (
              <p className="timestamp-field">
                Created: {formatTimestamp(currentFormData.createdAt)}
              </p>
            )}
            {currentFormData.updatedAt && (
              <p className="timestamp-field">
                Updated: {formatTimestamp(currentFormData.updatedAt)}
              </p>
            )}
          </section>
        )}
      </form>
    </div>
  );
}

export default MeetsForm;
