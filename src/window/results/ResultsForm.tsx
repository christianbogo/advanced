import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useFormContext, FormMode } from '../../form/FormContext';
import { useFilterContext } from '../../filter/FilterContext';
import { Result, Team, Season, Meet, Event, Athlete } from '../../types/data';
import { useTeams } from '../teams/useTeams';
import { useSeasons } from '../seasons/useSeasons';
import { useMeets } from '../meets/useMeets';
import { useEvents } from '../events/useEvents';
import AthleteSelectorModal from '../athletes/AthleteSelectorModal';
import { formatTimestamp, boolToString, stringToBool } from '../../utils/form';
import {
  hundredthsToTimeString,
  timeStringToHundredths,
} from '../../utils/time';
import '../../styles/form.css';

interface ResultsFormProps {
  mode: FormMode;
}

const getSafeArray = (arr: any[] | undefined | null): any[] =>
  Array.isArray(arr) ? arr : [];

const ResultsForm: React.FC<ResultsFormProps> = ({ mode }) => {
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
    isSaving,
    error,
    formData: currentFormData,
    selectedItem,
  } = state as typeof state & {
    formData: Partial<Result> | null;
    selectedItem?: Result | null;
  };
  const { state: filterState } = useFilterContext();

  const { data: teamsData, isLoading: isLoadingTeams } = useTeams();
  const { data: allSeasonsData, isLoading: isLoadingSeasons } = useSeasons();
  const { data: allMeetsData, isLoading: isLoadingMeets } = useMeets();
  const { data: allEventsData, isLoading: isLoadingEvents } = useEvents();

  const [isRelay, setIsRelay] = useState<boolean>(false);
  const [selectingAthleteSlot, setSelectingAthleteSlot] = useState<
    number | null
  >(null);
  const [resultTimeString, setResultTimeString] = useState<string>('');

  const isDisabled = mode === 'view' || mode === null || isSaving;
  const requiredAthletes = useMemo(() => (isRelay ? 4 : 1), [isRelay]);

  useEffect(() => {
    setIsRelay((currentFormData?.athletes?.length ?? 0) > 1);
    if (
      currentFormData?.result !== undefined &&
      currentFormData.result !== null
    ) {
      setResultTimeString(hundredthsToTimeString(currentFormData.result));
    } else {
      setResultTimeString('');
    }
  }, [currentFormData?.athletes, currentFormData?.result]);

  const availableSeasons = useMemo(() => {
    const currentTeam = currentFormData?.team as Team | undefined;
    if (!allSeasonsData || !currentTeam?.id) return [];
    return allSeasonsData.filter((season) => season.team.id === currentTeam.id);
  }, [allSeasonsData, currentFormData?.team]);

  const availableMeets = useMemo(() => {
    const currentSeason = currentFormData?.season as Season | undefined;
    if (!allMeetsData || !currentSeason?.id) return [];
    return allMeetsData.filter((meet) => meet.season.id === currentSeason.id);
  }, [allMeetsData, currentFormData?.season]);

  const availableEvents = useMemo(() => {
    // Basic: return all events. Implement meet-specific filtering if needed.
    return allEventsData ?? [];
  }, [allEventsData]);

  useEffect(() => {
    if (
      mode === 'add' &&
      !(currentFormData?.team as Team)?.id &&
      !(currentFormData?.season as Season)?.id &&
      teamsData &&
      allSeasonsData
    ) {
      const { season: superSelectedSeasonIds, team: superSelectedTeamIds } =
        filterState.superSelected;
      if (superSelectedSeasonIds.length === 1) {
        const seasonObject = allSeasonsData.find(
          (s) => s.id === superSelectedSeasonIds[0]
        );
        if (seasonObject?.team) {
          updateFormField('season', seasonObject);
          updateFormField('team', seasonObject.team); // Team object from season
        }
      } else if (superSelectedTeamIds.length === 1) {
        const teamObject = teamsData.find(
          (t) => t.id === superSelectedTeamIds[0]
        );
        if (teamObject) updateFormField('team', teamObject);
      }
    }
  }, [
    mode,
    filterState.superSelected,
    allSeasonsData,
    teamsData,
    updateFormField,
    currentFormData?.team,
    currentFormData?.season,
  ]);

  const handleTeamChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedTeamId = event.target.value;
      const teamObject = teamsData?.find((t) => t.id === selectedTeamId);
      updateFormField('team', teamObject ?? null);
      updateFormField('season', null);
      updateFormField('meet', null);
      updateFormField('event', null);
      updateFormField('athletes', []);
    },
    [teamsData, updateFormField]
  );

  const handleSeasonChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedSeasonId = event.target.value;
      const seasonObject = availableSeasons?.find(
        (s) => s.id === selectedSeasonId
      );
      updateFormField('season', seasonObject ?? null);
      updateFormField('meet', null);
      updateFormField('event', null);
      // Athletes are tied to season/team, could clear here or let AthleteSelector handle filtering
    },
    [availableSeasons, updateFormField]
  );

  const handleMeetChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedMeetId = event.target.value;
      const meetObject = availableMeets?.find((m) => m.id === selectedMeetId);
      updateFormField('meet', meetObject ?? null);
      updateFormField('event', null);
    },
    [availableMeets, updateFormField]
  );

  const handleEventChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedEventId = event.target.value;
      const eventObject = availableEvents?.find(
        (e) => e.id === selectedEventId
      );
      updateFormField('event', eventObject ?? null);
    },
    [availableEvents, updateFormField]
  );

  const handleRelayToggleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const relaySelected = event.target.value === 'relay';
      setIsRelay(relaySelected);
      updateFormField('athletes', []); // Clear athletes on type change
    },
    [updateFormField, setIsRelay]
  );

  const handleOpenAthleteModal = useCallback(
    (slotIndex: number) => {
      if (isDisabled) return;
      const currentTeam = currentFormData?.team as Team | undefined;
      const currentSeason = currentFormData?.season as Season | undefined;
      if (!currentTeam?.id || !currentSeason?.id) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Please select a Team and Season before choosing athletes.',
        });
        return;
      }
      if (error) dispatch({ type: 'SET_ERROR', payload: null });
      setSelectingAthleteSlot(slotIndex);
    },
    [
      isDisabled,
      currentFormData?.team,
      currentFormData?.season,
      dispatch,
      error,
    ]
  );

  const handleCloseAthleteModal = useCallback(
    () => setSelectingAthleteSlot(null),
    []
  );

  const handleAthleteSelect = useCallback(
    (selection: { athleteId: string; personId: string }) => {
      if (selectingAthleteSlot === null) return;
      // Find the Athlete object by athleteId
      const allAthletes: Athlete[] = getSafeArray(
        currentFormData?.allAthletes
      ) as Athlete[]; // You may need to provide allAthletes via props/context
      let selectedAthlete: Athlete | undefined = allAthletes.find(
        (ath) => ath.id === selection.athleteId
      );

      // Fallback: try to find in current athletes if not found in allAthletes
      if (!selectedAthlete) {
        selectedAthlete = (
          getSafeArray(currentFormData?.athletes) as Athlete[]
        ).find((ath) => ath?.id === selection.athleteId);
      }

      if (!selectedAthlete) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Selected athlete not found.',
        });
        return;
      }

      const currentAthletes = getSafeArray(
        currentFormData?.athletes
      ) as Athlete[];
      const newAthletes = [...currentAthletes];
      const targetSize = requiredAthletes;

      while (
        newAthletes.length < targetSize &&
        newAthletes.length < selectingAthleteSlot
      )
        newAthletes.push(undefined as any); // Pad if necessary
      newAthletes[selectingAthleteSlot] = selectedAthlete;

      // Trim or pad to ensure correct length for relay/individual
      const finalAthletes = newAthletes.slice(0, targetSize);
      while (finalAthletes.length < targetSize)
        finalAthletes.push(undefined as any); // Pad with placeholders if still short (e.g. first selection for relay)

      updateFormField('athletes', finalAthletes.filter(Boolean)); // Store only valid athletes
      handleCloseAthleteModal();
    },
    [
      selectingAthleteSlot,
      currentFormData?.athletes,
      currentFormData?.allAthletes,
      requiredAthletes,
      updateFormField,
      handleCloseAthleteModal,
      dispatch,
    ]
  );

  const handleTimeInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setResultTimeString(e.target.value);
    },
    []
  );

  const handleBooleanSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      updateFormField(name, stringToBool(value));
    },
    [updateFormField]
  );

  const handleEditClick = useCallback(() => {
    /* ... */
  }, []); // Placeholder, full logic from original
  const handleCancelClick = useCallback(() => {
    /* ... */
  }, []); // Placeholder
  const handleDeleteClick = useCallback(async () => {
    /* ... */
  }, []); // Placeholder

  const handleSaveClick = useCallback(async () => {
    if (isSaving || !currentFormData) return;

    const numericResult = timeStringToHundredths(resultTimeString);
    if (resultTimeString.trim() !== '' && numericResult === null) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Invalid result time format. Use MM:SS.HH or SS.HH.',
      });
      return;
    }

    // Update formData with numeric result before validation
    // This ensures currentFormData used in validation has the number.
    // Or, validate numericResult directly.
    const currentAthletesArray = getSafeArray(
      currentFormData?.athletes
    ) as Athlete[];
    const populatedAthletesCount = currentAthletesArray.filter(
      (ath) => ath?.id
    ).length;

    if (!(currentFormData.team as Team)?.id) {
      dispatch({ type: 'SET_ERROR', payload: 'Team is required.' });
      return;
    }
    if (!(currentFormData.season as Season)?.id) {
      dispatch({ type: 'SET_ERROR', payload: 'Season is required.' });
      return;
    }
    if (!(currentFormData.meet as Meet)?.id) {
      dispatch({ type: 'SET_ERROR', payload: 'Meet is required.' });
      return;
    }
    if (!(currentFormData.event as Event)?.id) {
      dispatch({ type: 'SET_ERROR', payload: 'Event is required.' });
      return;
    }
    if (numericResult === null) {
      dispatch({ type: 'SET_ERROR', payload: 'Result Time is required.' });
      return;
    }
    if (populatedAthletesCount !== requiredAthletes) {
      dispatch({
        type: 'SET_ERROR',
        payload: `Requires exactly ${requiredAthletes} athlete(s) selected. Found ${populatedAthletesCount}.`,
      });
      return;
    }

    if (error) dispatch({ type: 'SET_ERROR', payload: null });

    // Create a final payload to save, ensuring result is numeric and athletes array is clean
    const finalSaveData: Partial<Result> = {
      ...currentFormData,
      result: numericResult,
      // Ensure athletes array only contains valid, populated athlete objects
      athletes: ((currentFormData.athletes as Athlete[]) || []).filter(
        (ath) => ath?.id
      ),
    };

    // It's better if FormContext's saveForm takes the payload,
    // or we update context state piece by piece then call saveForm()
    // For now, assuming updateFormField for result, then saveForm()
    updateFormField('result', numericResult);
    updateFormField('athletes', finalSaveData.athletes);
    // Ensure other embedded objects are already set correctly
    // team, season, meet, event should be objects due to their handlers

    await saveForm();
  }, [
    isSaving,
    currentFormData,
    resultTimeString,
    requiredAthletes,
    saveForm,
    dispatch,
    error,
    updateFormField,
  ]);

  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        <section>
          <p className="form-section-title">Context</p>
          <div className="field">
            <label htmlFor="team">Team *</label>
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
                {isLoadingTeams ? 'Loading...' : '-- Select Team --'}
              </option>
              {teamsData?.map((team) => (
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
                  ? 'Loading...'
                  : !(currentFormData?.team as Team | undefined)?.id
                    ? 'Select Team First'
                    : '-- Select Season --'}
              </option>
              {availableSeasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.quarter ?? '?'} {season.year ?? '?'}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="meet">Meet *</label>
            <select
              id="meet"
              name="meet"
              value={(currentFormData?.meet as Meet | undefined)?.id ?? ''}
              onChange={handleMeetChange}
              disabled={
                !(currentFormData?.season as Season | undefined)?.id ||
                isDisabled ||
                isLoadingMeets
              }
              required
              aria-required="true"
            >
              <option value="" disabled>
                {isLoadingMeets
                  ? 'Loading...'
                  : !(currentFormData?.season as Season | undefined)?.id
                    ? 'Select Season First'
                    : '-- Select Meet --'}
              </option>
              {allMeetsData?.map((meet) => (
                <option key={meet.id} value={meet.id}>
                  {meet.nameShort ?? 'Unknown Meet'} (
                  {meet.date
                    ? new Date(meet.date).toLocaleDateString()
                    : 'No Date'}
                  )
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="event">Event *</label>
            <select
              id="event"
              name="event"
              value={(currentFormData?.event as Event | undefined)?.id ?? ''}
              onChange={handleEventChange}
              disabled={
                !(currentFormData?.meet as Meet | undefined)?.id ||
                isDisabled ||
                isLoadingEvents
              }
              required
              aria-required="true"
            >
              <option value="" disabled>
                {isLoadingEvents
                  ? 'Loading...'
                  : !(currentFormData?.meet as Meet | undefined)?.id
                    ? 'Select Meet First'
                    : '-- Select Event --'}
              </option>
              {availableEvents.map((event) => (
                <option
                  key={event.id}
                  value={event.id}
                >{`${event.distance || '?'}m ${event.stroke || '?'} ${event.course || '?'}`}</option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <p className="form-section-title">Athlete(s) *</p>
          <div className="field">
            <label htmlFor="resultType">Type</label>
            <select
              id="resultType"
              name="resultType"
              value={isRelay ? 'relay' : 'individual'}
              onChange={handleRelayToggleChange}
              disabled={isDisabled}
            >
              <option value="individual">Individual</option>
              <option value="relay">Relay</option>
            </select>
          </div>
          <div className="athlete-slots-container">
            {Array.from({ length: requiredAthletes }).map((_, index) => {
              const athleteObject = (
                getSafeArray(currentFormData?.athletes) as Athlete[]
              )[index];
              const personObject = athleteObject?.person;
              const displayName = personObject?.id
                ? `${personObject.preferredName || personObject.firstName} ${personObject.lastName}`.trim()
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
                          athleteObject?.id
                            ? `Change Athlete ${isRelay ? `Leg ${index + 1}` : ''}`
                            : `Select Athlete ${isRelay ? `Leg ${index + 1}` : ''}`
                        }
                      >
                        {athleteObject?.id ? 'Change' : 'Select'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {(getSafeArray(currentFormData?.athletes) as Athlete[]).filter(
            (ath) => ath?.id
          ).length !== requiredAthletes &&
            mode !== 'view' && (
              <p className="field-hint subtle">
                Selection required for all athletes.
              </p>
            )}
        </section>

        <section>
          <p className="form-section-title">Result Details</p>
          <div className="field">
            <label htmlFor="resultTime">Time *</label>
            <input
              type="text"
              id="resultTime"
              name="resultTime"
              placeholder="e.g., 1:05.32 or 28.91"
              value={resultTimeString}
              onChange={handleTimeInputChange}
              readOnly={isDisabled}
              required
              aria-required="true"
            />
          </div>
          <div className="field">
            <label htmlFor="dq">DQ?</label>
            <select
              id="dq"
              name="dq"
              value={boolToString(currentFormData?.dq)}
              onChange={handleBooleanSelectChange}
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
              onChange={handleBooleanSelectChange}
              disabled={isDisabled}
            >
              <option value="">--</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="benchmarks">Benchmark?</label>{' '}
            {/* Changed from Benchmarks? */}
            <select
              id="benchmarks"
              name="benchmarks"
              value={boolToString(currentFormData?.benchmarks)}
              onChange={handleBooleanSelectChange}
              disabled={isDisabled}
            >
              <option value="">--</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </section>

        <section>
          <p className="form-section-title">Actions</p>
          {error && <div className="form-message error">{error}</div>}
          <div className="buttons">
            {/* Buttons as before */}
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

      <AthleteSelectorModal
        isOpen={selectingAthleteSlot !== null}
        onClose={handleCloseAthleteModal}
        onSelect={handleAthleteSelect} // Expects (athlete: Athlete) => void
        teamId={(currentFormData?.team as Team | undefined)?.id || null}
        seasonId={(currentFormData?.season as Season | undefined)?.id || null}
        excludeIds={
          isRelay
            ? (getSafeArray(currentFormData?.athletes) as Athlete[])
                .map((ath) => ath?.id)
                .filter(
                  (id) =>
                    id &&
                    (currentFormData?.athletes as Athlete[])[
                      selectingAthleteSlot ?? -1
                    ]?.id !== id
                )
            : []
        }
      />
    </div>
  );
};

export default ResultsForm;
