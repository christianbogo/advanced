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
// TODO: Import useAthletes or a similar hook to fetch athletes for the current meet context
// import { useAthletes } from '../athletes/useAthletes';

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
    saveForm,
    clearForm,
    revertFormData,
    deleteItem,
    selectItemForForm, // Ensure this is destructured
  } = useFormContext();
  const {
    isSaving,
    error,
    formData: currentFormData,
    selectedItem,
  } = state as typeof state & {
    formData: Partial<Result> | null;
    selectedItem?: (Partial<Result> & { id?: string; mode?: FormMode }) | null; // More specific type for selectedItem
  };
  const { state: filterState } = useFilterContext();

  const { data: teamsData, isLoading: isLoadingTeams } = useTeams();
  const { data: allSeasonsData, isLoading: isLoadingSeasons } = useSeasons();
  const { data: allMeetsDataFromHook, isLoading: isLoadingMeets } = useMeets();
  const { data: allEventsData, isLoading: isLoadingEvents } = useEvents();

  // TODO: Replace this with actual data fetching for athletes relevant to the selected meet
  const [athletesForMeetContext, setAthletesForMeetContext] = useState<
    Athlete[]
  >([]);

  const [selectedTeamIdForFilter, setSelectedTeamIdForFilter] =
    useState<string>('');
  const [selectedSeasonIdForFilter, setSelectedSeasonIdForFilter] =
    useState<string>('');
  const [isRelay, setIsRelay] = useState<boolean>(false);
  const [selectingAthleteSlot, setSelectingAthleteSlot] = useState<
    number | null
  >(null);
  const [resultTimeString, setResultTimeString] = useState<string>('');

  const isDisabled = mode === 'view' || mode === null || isSaving;
  const requiredAthletes = useMemo(() => (isRelay ? 4 : 1), [isRelay]);

  useEffect(() => {
    const resultMeet = currentFormData?.meet as Meet | undefined;
    if (mode === 'edit' || mode === 'view') {
      if (resultMeet?.season?.team?.id) {
        setSelectedTeamIdForFilter(resultMeet.season.team.id);
      } else {
        setSelectedTeamIdForFilter('');
      }
      if (resultMeet?.season?.id) {
        setSelectedSeasonIdForFilter(resultMeet.season.id);
      } else {
        setSelectedSeasonIdForFilter('');
      }
    } else if (mode === 'add') {
      if (!currentFormData?.meet) {
        // Fallback clear if pre-selection doesn't happen and no meet on form
        if (
          !selectedTeamIdForFilter &&
          !(
            filterState.superSelected.team.length > 0 ||
            filterState.superSelected.meet.length > 0 ||
            filterState.superSelected.season.length > 0
          )
        )
          setSelectedTeamIdForFilter('');
        if (
          !selectedSeasonIdForFilter &&
          !(
            filterState.superSelected.meet.length > 0 ||
            filterState.superSelected.season.length > 0
          )
        )
          setSelectedSeasonIdForFilter('');
      } else if (resultMeet?.season?.team?.id && resultMeet?.season?.id) {
        setSelectedTeamIdForFilter(resultMeet.season.team.id);
        setSelectedSeasonIdForFilter(resultMeet.season.id);
      }
    }
  }, [
    mode,
    currentFormData?.meet,
    filterState.superSelected.team,
    filterState.superSelected.season,
    filterState.superSelected.meet,
    selectedTeamIdForFilter,
    selectedSeasonIdForFilter,
  ]);

  useEffect(() => {
    if (
      mode === 'add' &&
      !currentFormData?.meet &&
      !(selectedTeamIdForFilter && selectedSeasonIdForFilter) && // More precise: only if both filters aren't already meaningfully set
      teamsData &&
      allSeasonsData &&
      allMeetsDataFromHook
    ) {
      const {
        meet: superSelectedMeetIds,
        season: superSelectedSeasonIds,
        team: superSelectedTeamIds,
      } = filterState.superSelected;

      let preSelectedTeamIdVal = '';
      let preSelectedSeasonIdVal = '';
      let preSelectedMeetObj: Meet | null = null;

      if (superSelectedMeetIds?.length === 1) {
        const meetObject = allMeetsDataFromHook.find(
          (m) => m.id === superSelectedMeetIds[0]
        );
        if (meetObject?.season?.team?.id && meetObject?.season?.id) {
          preSelectedMeetObj = meetObject;
          preSelectedSeasonIdVal = meetObject.season.id;
          preSelectedTeamIdVal = meetObject.season.team.id;
        }
      } else if (superSelectedSeasonIds?.length === 1) {
        const seasonObject = allSeasonsData.find(
          (s) => s.id === superSelectedSeasonIds[0]
        );
        if (seasonObject?.team?.id) {
          preSelectedSeasonIdVal = seasonObject.id;
          preSelectedTeamIdVal = seasonObject.team.id;
        }
      } else if (superSelectedTeamIds?.length === 1) {
        const teamObject = teamsData.find(
          (t) => t.id === superSelectedTeamIds[0]
        );
        if (teamObject) {
          preSelectedTeamIdVal = teamObject.id;
        }
      }

      if (preSelectedTeamIdVal)
        setSelectedTeamIdForFilter(preSelectedTeamIdVal);
      if (preSelectedSeasonIdVal)
        setSelectedSeasonIdForFilter(preSelectedSeasonIdVal);
      if (preSelectedMeetObj) updateFormField('meet', preSelectedMeetObj);
    }
  }, [
    mode,
    filterState.superSelected,
    teamsData,
    allSeasonsData,
    allMeetsDataFromHook,
    updateFormField,
    currentFormData?.meet,
    selectedTeamIdForFilter,
    selectedSeasonIdForFilter,
  ]);

  useEffect(() => {
    const athletes = getSafeArray(currentFormData?.athletes) as Athlete[];
    setIsRelay(athletes.length > 1);
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
    if (!allSeasonsData || !selectedTeamIdForFilter) return [];
    return allSeasonsData.filter(
      (season) => season.team.id === selectedTeamIdForFilter
    );
  }, [allSeasonsData, selectedTeamIdForFilter]);

  const availableMeets = useMemo(() => {
    if (!allMeetsDataFromHook || !selectedSeasonIdForFilter) return [];
    return allMeetsDataFromHook.filter(
      (meet) => meet.season.id === selectedSeasonIdForFilter
    );
  }, [allMeetsDataFromHook, selectedSeasonIdForFilter]);

  const availableEvents = useMemo(() => {
    const meet = currentFormData?.meet as Meet | undefined;
    if (!allEventsData || !meet?.eventOrder?.length) return allEventsData ?? [];
    // Assuming meet.eventOrder is string[] and Event has id: string
    // If meet.eventOrder was changed to Event[], this part needs adjustment for Error 1.
    // Based on the error "Argument of type 'string' is not assignable to parameter of type 'Event'"
    // on meetEventIds.has(event.id), it implies meet.eventOrder is Event[].
    const meetEventIdSet = new Set(
      (meet.eventOrder as string[] | Event[]).map((item) =>
        typeof item === 'string' ? item : item.id
      )
    ); // Robustly create Set<string>
    return (allEventsData || []).filter((event: Event) =>
      meetEventIdSet.has(event.id)
    );
  }, [allEventsData, currentFormData?.meet]);

  const handleTeamChange = useCallback(
    /* ...as before... */ (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newTeamId = event.target.value;
      setSelectedTeamIdForFilter(newTeamId);
      setSelectedSeasonIdForFilter('');
      updateFormField('meet', null);
      updateFormField('event', null);
      updateFormField('athletes', []);
    },
    [updateFormField]
  );

  const handleSeasonChange = useCallback(
    /* ...as before... */ (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newSeasonId = event.target.value;
      setSelectedSeasonIdForFilter(newSeasonId);
      updateFormField('meet', null);
      updateFormField('event', null);
      updateFormField('athletes', []);
    },
    [updateFormField]
  );

  const handleMeetChange = useCallback(
    /* ...as before... */ (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedMeetId = event.target.value;
      const meetObject = availableMeets?.find((m) => m.id === selectedMeetId);
      updateFormField('meet', meetObject ?? null);
      updateFormField('event', null);
    },
    [availableMeets, updateFormField]
  );

  const handleEventChange = useCallback(
    /* ...as before... */ (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedEventId = event.target.value;
      const eventObject = availableEvents?.find(
        (e) => e.id === selectedEventId
      );
      updateFormField('event', eventObject ?? null);
    },
    [availableEvents, updateFormField]
  );

  const handleRelayToggleChange = useCallback(
    /* ...as before... */ (event: React.ChangeEvent<HTMLSelectElement>) => {
      const relaySelected = event.target.value === 'relay';
      setIsRelay(relaySelected);
      updateFormField('athletes', []);
    },
    [updateFormField]
  );

  const handleOpenAthleteModal = useCallback(
    /* ...as before... */ (slotIndex: number) => {
      if (isDisabled) return;
      const currentMeetForModal = currentFormData?.meet as Meet | undefined;
      if (
        !currentMeetForModal?.season?.team?.id ||
        !currentMeetForModal?.season?.id
      ) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Please select a Meet before choosing athletes.',
        });
        return;
      }
      if (error) dispatch({ type: 'SET_ERROR', payload: null });
      // TODO: Populate athletesForMeetContext based on currentMeetForModal
      setSelectingAthleteSlot(slotIndex);
    },
    [isDisabled, currentFormData?.meet, dispatch, error]
  );

  const handleCloseAthleteModal = useCallback(
    /* ...as before... */ () => setSelectingAthleteSlot(null),
    []
  );

  // Assuming AthleteSelectorModal's onSelect prop is (selection: { athleteId: string; personId: string; }) => void
  const handleAthleteSelect = useCallback(
    (selection: { athleteId: string; personId: string }) => {
      if (selectingAthleteSlot === null) return;

      // TODO: This is a placeholder. You need to fetch/have access to the full Athlete objects for the current meet.
      // const athletesAvailableForMeet = athletesForMeetContext; // Use the state variable holding fetched athletes
      const athletesAvailableForMeet: Athlete[] = []; // Replace with actual data

      const selectedAthleteObject: Athlete | undefined =
        athletesAvailableForMeet.find((ath) => ath.id === selection.athleteId);

      if (!selectedAthleteObject) {
        dispatch({
          type: 'SET_ERROR',
          payload: `Athlete (ID: ${selection.athleteId}) details not found. Load athletes for meet.`,
        });
        return;
      }

      const currentAthletes = getSafeArray(currentFormData?.athletes) as (
        | Athlete
        | undefined
        | null
      )[];
      const newAthletes = [...currentAthletes];
      const targetSize = requiredAthletes;

      while (
        newAthletes.length < targetSize &&
        newAthletes.length < selectingAthleteSlot
      ) {
        newAthletes.push(null);
      }
      newAthletes[selectingAthleteSlot] = selectedAthleteObject;

      let finalAthletesForForm = newAthletes.slice(0, targetSize);
      while (finalAthletesForForm.length < targetSize) {
        finalAthletesForForm.push(null);
      }

      updateFormField('athletes', finalAthletesForForm);
      handleCloseAthleteModal();
    },
    [
      selectingAthleteSlot,
      currentFormData?.athletes,
      requiredAthletes,
      updateFormField,
      handleCloseAthleteModal,
      dispatch,
      athletesForMeetContext, // Add as dependency
    ]
  );

  const handleTimeInputChange = useCallback(
    /* ...as before... */ (e: React.ChangeEvent<HTMLInputElement>) => {
      setResultTimeString(e.target.value);
    },
    []
  );

  const handleBooleanSelectChange = useCallback(
    /* ...as before... */ (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      updateFormField(name as keyof Result, stringToBool(value));
    },
    [updateFormField]
  );

  const handleEditClick = useCallback(
    /* ...as before... */ () => {
      const currentSelectedItem = selectedItem as
        | (Partial<Result> & { id?: string })
        | null;
      if (currentSelectedItem?.id) {
        selectItemForForm('result', currentSelectedItem.id, 'edit');
      }
    },
    [selectedItem, selectItemForForm]
  );

  const handleCancelClick = useCallback(
    /* ...as before... */ () => {
      const currentSelectedItem = selectedItem as
        | (Partial<Result> & { id?: string; mode?: FormMode })
        | null;
      if (currentSelectedItem?.mode === 'add') {
        clearForm();
      } else if (currentSelectedItem?.id) {
        revertFormData();
        selectItemForForm('result', currentSelectedItem.id, 'view');
      }
    },
    [selectedItem, clearForm, revertFormData, selectItemForForm]
  );

  const handleDeleteClick = useCallback(
    /* ...as before... */ async () => {
      const currentSelectedItem = selectedItem as
        | (Partial<Result> & { id?: string })
        | null;
      if (isSaving || !currentSelectedItem?.id) return;
      await deleteItem();
    },
    [isSaving, selectedItem, deleteItem]
  );

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

    const currentAthletesArray = getSafeArray(currentFormData?.athletes) as (
      | Athlete
      | undefined
      | null
    )[];
    const populatedAthletes = currentAthletesArray.filter(
      (ath): ath is Athlete => !!ath?.id
    );

    if (!(currentFormData.meet as Meet)?.id) {
      /* ...validation as before... */ dispatch({
        type: 'SET_ERROR',
        payload: 'Meet is required.',
      });
      return;
    }
    if (!(currentFormData.meet as Meet)?.season?.id) {
      /* ...validation as before... */ dispatch({
        type: 'SET_ERROR',
        payload: 'Selected Meet is missing Season information.',
      });
      return;
    }
    if (!(currentFormData.meet as Meet)?.season?.team?.id) {
      /* ...validation as before... */ dispatch({
        type: 'SET_ERROR',
        payload: 'Selected Meet is missing Team information (via Season).',
      });
      return;
    }
    if (!(currentFormData.event as Event)?.id) {
      /* ...validation as before... */ dispatch({
        type: 'SET_ERROR',
        payload: 'Event is required.',
      });
      return;
    }
    if (
      numericResult === null &&
      resultTimeString.trim() === '' &&
      !(currentFormData.dq === true)
    ) {
      /* ...validation as before... */ dispatch({
        type: 'SET_ERROR',
        payload: 'Result Time is required if not a DQ.',
      });
      return;
    }
    if (populatedAthletes.length !== requiredAthletes) {
      /* ...validation as before... */ dispatch({
        type: 'SET_ERROR',
        payload: `Requires exactly ${requiredAthletes} athlete(s) selected. Found ${populatedAthletes.length}.`,
      });
      return;
    }

    if (error) dispatch({ type: 'SET_ERROR', payload: null });

    const finalSaveData: Partial<Result> = {
      id: currentFormData.id,
      meet: currentFormData.meet as Meet,
      event: currentFormData.event as Event,
      athletes: populatedAthletes,
      result: numericResult === null ? undefined : numericResult, // CORRECTED for TS2322
      dq: currentFormData.dq ?? false,
      isOfficial: currentFormData.isOfficial ?? false,
      isBenchmark: currentFormData.isBenchmark ?? false,
    };

    updateFormField('result', finalSaveData.result);
    updateFormField('athletes', finalSaveData.athletes);
    updateFormField('dq', finalSaveData.dq);
    updateFormField('isOfficial', finalSaveData.isOfficial);
    updateFormField('isBenchmark', finalSaveData.isBenchmark);
    // meet & event are already objects in currentFormData

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
      {/* JSX (ensure team/season dropdowns use selectedTeamIdForFilter/selectedSeasonIdForFilter for their values) */}
      {/* ... form structure as previously outlined, ensuring value props of Team/Season selects use local filter state ... */}
      <form onSubmit={(e) => e.preventDefault()}>
        <section>
          <p className="form-section-title">Context</p>
          <div className="field">
            <label htmlFor="teamFilter">Team *</label>
            <select
              id="teamFilter"
              name="teamFilter"
              value={selectedTeamIdForFilter}
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
            <label htmlFor="seasonFilter">Season *</label>
            <select
              id="seasonFilter"
              name="seasonFilter"
              value={selectedSeasonIdForFilter}
              onChange={handleSeasonChange}
              disabled={
                !selectedTeamIdForFilter || isDisabled || isLoadingSeasons
              }
              required
              aria-required="true"
            >
              <option value="" disabled>
                {isLoadingSeasons
                  ? 'Loading...'
                  : !selectedTeamIdForFilter
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
                !selectedSeasonIdForFilter || isDisabled || isLoadingMeets
              }
              required
              aria-required="true"
            >
              <option value="" disabled>
                {isLoadingMeets
                  ? 'Loading...'
                  : !selectedSeasonIdForFilter
                    ? 'Select Season First'
                    : '-- Select Meet --'}
              </option>
              {availableMeets.map((meet) => (
                <option key={meet.id} value={meet.id}>
                  {meet.nameShort ?? 'Unknown Meet'} (
                  {meet.date
                    ? new Date(meet.date + 'T00:00:00').toLocaleDateString()
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
              const athleteSlotValue = (
                getSafeArray(currentFormData?.athletes) as (
                  | Athlete
                  | undefined
                  | null
                )[]
              )[index];
              const athleteObject = athleteSlotValue || null;
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
          {(
            getSafeArray(currentFormData?.athletes) as (Athlete | null)[]
          ).filter((ath) => !!ath?.id).length !== requiredAthletes &&
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
              required={!(currentFormData?.dq === true)}
              aria-required={!(currentFormData?.dq === true)}
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
              name="isOfficial"
              value={boolToString(currentFormData?.isOfficial)}
              onChange={handleBooleanSelectChange}
              disabled={isDisabled}
            >
              <option value="">--</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="benchmarks">Benchmark?</label>
            <select
              id="benchmarks"
              name="isBenchmark"
              value={boolToString(currentFormData?.isBenchmark)}
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
                  className="primary"
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

        {(currentFormData?.createdAt || currentFormData?.updatedAt) && (
          <section className="form-timestamps">
            {currentFormData.createdAt && (
              <p className="timestamp-field">
                {' '}
                Created: {formatTimestamp(currentFormData.createdAt)}{' '}
              </p>
            )}
            {currentFormData.updatedAt && (
              <p className="timestamp-field">
                {' '}
                Updated: {formatTimestamp(currentFormData.updatedAt)}{' '}
              </p>
            )}
          </section>
        )}
      </form>

      <AthleteSelectorModal
        isOpen={selectingAthleteSlot !== null}
        onClose={handleCloseAthleteModal}
        onSelect={handleAthleteSelect}
        teamId={
          (currentFormData?.meet as Meet | undefined)?.season?.team?.id ||
          selectedTeamIdForFilter ||
          null
        }
        seasonId={
          (currentFormData?.meet as Meet | undefined)?.season?.id ||
          selectedSeasonIdForFilter ||
          null
        }
        excludeIds={
          isRelay
            ? (
                getSafeArray(currentFormData?.athletes) as (
                  | Athlete
                  | undefined
                  | null
                )[]
              )
                .map((ath) => ath?.id)
                .filter(
                  (id, idx): id is string =>
                    !!id && idx !== selectingAthleteSlot
                )
            : []
        }
      />
    </div>
  );
};

export default ResultsForm;
