import React, { useMemo, useState, useCallback } from 'react';
import { useFormContext, FormMode } from '../../form/FormContext';
import { Meet, Team, Season, Event } from '../../types/data';
import { useTeams } from '../teams/useTeams';
import { useSeasons } from '../seasons/useSeasons';
import { useEvents } from '../events/useEvents';
import { Timestamp } from 'firebase/firestore';
import '../../styles/form.css';

interface MeetsFormProps {
  formData: Partial<Meet> | null;
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

function MeetsForm({ formData, mode }: MeetsFormProps) {
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
  const { selectedItem, isSaving, error, formData: currentFormData } = state;

  const { data: teamsData, isLoading: isLoadingTeams } = useTeams();
  const { data: allSeasonsData, isLoading: isLoadingSeasons } = useSeasons();
  const { data: allEventsData, isLoading: isLoadingEvents } = useEvents();

  const [selectedEventToAdd, setSelectedEventToAdd] = useState<string>('');
  const isDisabled = mode === 'view' || mode === null || isSaving;

  const availableSeasons = useMemo(() => {
    if (!allSeasonsData || !currentFormData?.team) {
      return [];
    }
    const currentTeamObj = currentFormData.team as Team | undefined;
    if (!currentTeamObj?.id) return [];
    return allSeasonsData.filter(
      (season) => season.team.id === currentTeamObj.id
    );
  }, [allSeasonsData, currentFormData?.team]);

  const eventMap = useMemo(() => {
    if (!allEventsData) return new Map<string, Event>();
    return new Map<string, Event>(
      allEventsData.map((event: Event) => [event.id, event])
    );
  }, [allEventsData]);

  const currentEventOrder: string[] = useMemo(
    () => (currentFormData?.eventOrder as string[]) ?? [],
    [currentFormData?.eventOrder]
  );

  const handleTextFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      updateFormField(name, value);
    },
    [updateFormField]
  );

  const handleBooleanSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      updateFormField(name, stringToBool(value));
    },
    [updateFormField]
  );

  const handleTeamChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedTeamId = event.target.value;
      const teamObject = teamsData?.find((t) => t.id === selectedTeamId);

      if (teamObject) {
        updateFormField('team', teamObject);
        const currentSeasonObject = currentFormData?.season as
          | Season
          | undefined;
        if (
          currentSeasonObject &&
          currentSeasonObject.team.id !== teamObject.id
        ) {
          updateFormField('season', null);
        }
      } else {
        updateFormField('team', null);
        updateFormField('season', null);
      }
    },
    [teamsData, updateFormField, currentFormData?.season]
  );

  const handleSeasonChange = useCallback(
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
    setSelectedEventToAdd(e.target.value);
  };

  const handleAddEvent = useCallback(() => {
    if (!selectedEventToAdd || currentEventOrder.includes(selectedEventToAdd))
      return;
    const newEventOrder = [...currentEventOrder, selectedEventToAdd];
    updateFormField('eventOrder', newEventOrder);
    setSelectedEventToAdd('');
  }, [currentEventOrder, selectedEventToAdd, updateFormField]);

  const handleRemoveEvent = useCallback(
    (indexToRemove: number) => {
      const newEventOrder = currentEventOrder.filter(
        (_, index) => index !== indexToRemove
      );
      updateFormField('eventOrder', newEventOrder);
    },
    [currentEventOrder, updateFormField]
  );

  const handleMoveEvent = useCallback(
    (index: number, direction: -1 | 1) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= currentEventOrder.length) return;
      const newEventOrder = [...currentEventOrder];
      [newEventOrder[index], newEventOrder[newIndex]] = [
        newEventOrder[newIndex],
        newEventOrder[index],
      ];
      updateFormField('eventOrder', newEventOrder);
    },
    [currentEventOrder, updateFormField]
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
    if (isSaving) return;
    await deleteItem();
  }, [isSaving, deleteItem]);

  const handleSaveClick = useCallback(async () => {
    if (isSaving || !currentFormData) return;

    const teamObject = currentFormData.team as Team | undefined;
    const seasonObject = currentFormData.season as Season | undefined;

    if (
      !currentFormData.nameShort ||
      !currentFormData.nameLong ||
      !teamObject?.id ||
      !seasonObject?.id ||
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
        <section>
          <p className="form-section-title">Meet Details</p>
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
              value={(currentFormData?.team as Team | undefined)?.id ?? ''}
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
                !(currentFormData?.team as Team | undefined)?.id ||
                isDisabled ||
                isLoadingSeasons
              }
              required
              aria-required="true"
            >
              <option value="" disabled>
                {isLoadingSeasons
                  ? 'Loading seasons...'
                  : (currentFormData?.team as Team | undefined)?.id
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

        <section>
          <p className="form-section-title">Date & Location</p>
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
              value={selectedEventToAdd}
              onChange={handleSelectedEventChange}
              disabled={isDisabled || isLoadingEvents}
            >
              <option value="" disabled>
                {isLoadingEvents ? 'Loading events...' : 'Select an Event'}
              </option>
              {allEventsData?.map((event: Event) => (
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
              Add
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

        <section>
          <p className="form-section-title">Settings & Status</p>
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
