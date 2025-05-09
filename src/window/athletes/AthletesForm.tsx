// src/window/athletes/AthletesForm.tsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useFormContext, FormMode } from '../../form/FormContext';
import { useFilterContext } from '../../filter/FilterContext';
import { Athlete, Person, Season, Team } from '../../types/data'; // Team is needed for type hints
import { Timestamp } from 'firebase/firestore';
import { useTeams } from '../teams/useTeams';
import { useSeasons } from '../seasons/useSeasons';
import PersonSelectorModal from '../persons/PersonSelectorModal';
import '../../styles/form.css';

const formatTimestamp = (timestamp: Timestamp | undefined | null): string => {
  if (timestamp && timestamp instanceof Timestamp) {
    const date = timestamp.toDate();
    return date.toLocaleString(undefined, {
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

interface AthletesFormProps {
  formData: Partial<Athlete> | null; // This is initialFormData from the parent
  mode: FormMode;
}

function AthletesForm({
  formData: initialFormDataProp,
  mode,
}: AthletesFormProps) {
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
  const { selectedItem, isSaving, error, formData: currentFormData } = state; // Use currentFormData from context
  const { state: filterState } = useFilterContext();

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [selectedTeamIdForFilter, setSelectedTeamIdForFilter] =
    useState<string>(''); // Local state for team dropdown

  const { data: teamsData, isLoading: isLoadingTeams } = useTeams(); // Still need all teams for the dropdown
  const { data: allSeasonsData, isLoading: isLoadingSeasons } = useSeasons();

  const isDisabled = mode === 'view' || mode === null || isSaving;

  const availableSeasons = useMemo(() => {
    if (!allSeasonsData || !selectedTeamIdForFilter) {
      return [];
    }
    return allSeasonsData.filter(
      (season) => season.team.id === selectedTeamIdForFilter
    );
  }, [allSeasonsData, selectedTeamIdForFilter]);

  const selectedPersonName = useMemo(() => {
    const person = currentFormData?.person as Person | undefined;
    if (!person?.id) return 'No Person Selected';
    const firstName = person.preferredName || person.firstName;
    const lastName = person.lastName;
    return (
      `${firstName ?? ''} ${lastName ?? ''}`.trim() || `Person ID: ${person.id}`
    );
  }, [currentFormData?.person]);

  // Effect to initialize selectedTeamIdForFilter when form mode changes or initial data (Athlete's season) is loaded
  useEffect(() => {
    if (mode === 'edit' || mode === 'view') {
      const currentAthleteSeason = currentFormData?.season as
        | Season
        | undefined;
      if (currentAthleteSeason?.team?.id) {
        setSelectedTeamIdForFilter(currentAthleteSeason.team.id);
      } else {
        setSelectedTeamIdForFilter('');
      }
    } else if (mode === 'add') {
      // For 'add' mode, if not set by pre-selection logic below, ensure it's cleared.
      // This handles cases like navigating back to an "add" form that might have stale filter state.
      if (!selectedTeamIdForFilter && !currentFormData?.season) {
        // Only clear if nothing indicates a team/season yet
        setSelectedTeamIdForFilter('');
      }
    }
  }, [mode, currentFormData?.season]);

  // Effect for pre-selecting team filter and/or athlete's season in 'add' mode
  useEffect(() => {
    if (
      mode === 'add' &&
      // Only attempt pre-selection if athlete's season isn't set AND team filter isn't set by other means.
      // This prevents overriding user actions or previous pre-selection for the same "add instance".
      !currentFormData?.season &&
      !selectedTeamIdForFilter &&
      teamsData &&
      allSeasonsData
    ) {
      const { season: superSelectedSeasonIds, team: superSelectedTeamIds } =
        filterState.superSelected;

      if (superSelectedSeasonIds.length === 1) {
        const seasonId = superSelectedSeasonIds[0];
        const seasonObject = allSeasonsData.find((s) => s.id === seasonId);
        if (seasonObject?.team?.id) {
          updateFormField('season', seasonObject); // Set the actual season on the Athlete
          setSelectedTeamIdForFilter(seasonObject.team.id); // Set the team dropdown filter
        }
      } else if (superSelectedTeamIds.length === 1) {
        const teamId = superSelectedTeamIds[0];
        const teamObject = teamsData.find((t) => t.id === teamId);
        if (teamObject) {
          setSelectedTeamIdForFilter(teamObject.id); // Only set the team dropdown filter
          // Do not set currentFormData.team for the athlete
        }
      }
    }
  }, [
    mode,
    filterState.superSelected.season,
    filterState.superSelected.team,
    allSeasonsData,
    teamsData,
    updateFormField,
    currentFormData?.season, // Dependency to ensure it doesn't run if season gets set
    selectedTeamIdForFilter, // Dependency to ensure it doesn't run if filter gets set
  ]);

  const handleGenericFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFormField(e.target.name as keyof Athlete, e.target.value);
    },
    [updateFormField]
  );

  const handleTeamChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newTeamId = event.target.value;
      setSelectedTeamIdForFilter(newTeamId);

      const currentSeasonObject = currentFormData?.season as Season | undefined;
      if (currentSeasonObject && currentSeasonObject.team.id !== newTeamId) {
        updateFormField('season', null); // Clear athlete's season if team filter changes and mismatches
      }
    },
    [currentFormData?.season, updateFormField]
  );

  const handleSeasonChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedSeasonId = event.target.value;
      // availableSeasons is already filtered by selectedTeamIdForFilter
      const seasonObject = availableSeasons?.find(
        (s) => s.id === selectedSeasonId
      );
      updateFormField('season', seasonObject ?? null); // Set the actual season on the Athlete
    },
    [availableSeasons, updateFormField]
  );

  const handleOpenPersonModal = useCallback(() => {
    if (!isDisabled) setIsPersonModalOpen(true);
  }, [isDisabled]);

  const handleClosePersonModal = useCallback(
    () => setIsPersonModalOpen(false),
    []
  );

  const handlePersonSelect = useCallback(
    (selectedPerson: Person) => {
      updateFormField('person', selectedPerson);
      setIsPersonModalOpen(false);
    },
    [updateFormField]
  );

  const handleTriggerAddNewPerson = useCallback(() => {
    selectItemForForm('person', null, 'add');
  }, [selectItemForForm]);

  const handleEditClick = useCallback(() => {
    if (selectedItem?.type === 'athlete' && selectedItem?.id) {
      selectItemForForm(selectedItem.type, selectedItem.id, 'edit');
    }
  }, [selectedItem, selectItemForForm]);

  const handleCancelClick = useCallback(() => {
    if (selectedItem?.mode === 'add') {
      clearForm(); // This should also clear selectedTeamIdForFilter via the useEffect for mode 'add'
    } else if (selectedItem?.type === 'athlete' && selectedItem?.id) {
      revertFormData();
      selectItemForForm(selectedItem.type, selectedItem.id, 'view');
    }
  }, [selectedItem, clearForm, revertFormData, selectItemForForm]);

  const handleDeleteClick = useCallback(async () => {
    if (isSaving || !selectedItem?.id) return;
    await deleteItem();
  }, [isSaving, selectedItem, deleteItem]);

  const handleSaveClick = useCallback(async () => {
    if (isSaving || !currentFormData) return;
    const seasonObject = currentFormData.season as Season | undefined;
    const personObject = currentFormData.person as Person | undefined;

    if (!personObject?.id || !seasonObject?.id) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'A Person and Season must be selected.',
      });
      return;
    }
    // Ensure the season object itself has valid team information, as this is crucial
    if (!seasonObject.team?.id) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          'The selected Season does not have associated Team information. Please re-select the Season.',
      });
      return;
    }

    if (error) dispatch({ type: 'SET_ERROR', payload: null });

    // The currentFormData sent to saveForm should now correctly represent the new Athlete structure
    // (i.e., no direct 'team' field, team info is within 'season')
    await saveForm();
  }, [isSaving, currentFormData, saveForm, dispatch, error]);

  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        <section>
          <p className="form-section-title">Person</p>
          {/* ... Person selection UI ... */}
          <div className="field person-selection-field">
            <label htmlFor="personDisplay">Selected Person</label>
            <div className="person-display-container">
              <span id="personDisplay" className="person-display-name">
                {selectedPersonName}
              </span>
              {(mode === 'add' || mode === 'edit') && (
                <button
                  type="button"
                  className="button-change-person"
                  onClick={handleOpenPersonModal}
                  disabled={isDisabled}
                  aria-label={
                    currentFormData?.person
                      ? 'Change selected person'
                      : 'Select a person'
                  }
                >
                  {currentFormData?.person ? 'Change' : 'Select'}
                </button>
              )}
            </div>
          </div>
          {!isPersonModalOpen &&
            mode !== 'view' &&
            !(currentFormData?.person as Person | undefined)?.id && (
              <p className="field-hint subtle">
                Search or add person (required).
              </p>
            )}
        </section>

        <section>
          <p className="form-section-title">Team & Season Assignment</p>
          <div className="field">
            <label htmlFor="teamFilter">Team</label>{' '}
            {/* Changed id for clarity */}
            <select
              id="teamFilter" // Changed id
              name="teamFilter" // Changed name
              value={selectedTeamIdForFilter} // MODIFIED: Use local state for value
              onChange={handleTeamChange}
              disabled={isDisabled || isLoadingTeams}
              required // Keep required for UX flow, even if not saved on Athlete
              aria-required="true"
            >
              <option value="" disabled>
                {isLoadingTeams ? 'Loading Teams...' : '-- Select Team --'}
              </option>
              {teamsData?.map((team) => (
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
              name="season" // This name matches the Athlete field 'season'
              value={(currentFormData?.season as Season | undefined)?.id ?? ''}
              onChange={handleSeasonChange}
              disabled={
                !selectedTeamIdForFilter || // MODIFIED: Disable if no team filter selected
                isDisabled ||
                isLoadingSeasons
              }
              required
              aria-required="true"
            >
              <option value="" disabled>
                {isLoadingSeasons
                  ? 'Loading Seasons...'
                  : !selectedTeamIdForFilter // MODIFIED
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
        </section>

        {/* ... Athlete Details, Actions, Timestamps sections ... */}
        <section>
          <p className="form-section-title">Athlete Details (Optional)</p>
          {/* ... grade, group, subgroup, lane fields ... */}
          <div className="field">
            <label htmlFor="grade">Grade</label>
            <input
              type="text"
              id="grade"
              name="grade"
              value={currentFormData?.grade ?? ''}
              onChange={handleGenericFieldChange}
              readOnly={isDisabled}
            />
          </div>
          <div className="field">
            <label htmlFor="group">Group</label>
            <input
              type="text"
              id="group"
              name="group"
              value={currentFormData?.group ?? ''}
              onChange={handleGenericFieldChange}
              readOnly={isDisabled}
            />
          </div>
          <div className="field">
            <label htmlFor="subgroup">Subgroup</label>
            <input
              type="text"
              id="subgroup"
              name="subgroup"
              value={currentFormData?.subgroup ?? ''}
              onChange={handleGenericFieldChange}
              readOnly={isDisabled}
            />
          </div>
          <div className="field">
            <label htmlFor="lane">Lane</label>
            <input
              type="text"
              id="lane"
              name="lane"
              value={currentFormData?.lane ?? ''}
              onChange={handleGenericFieldChange}
              readOnly={isDisabled}
            />
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

      <PersonSelectorModal
        isOpen={isPersonModalOpen}
        onClose={handleClosePersonModal}
        onSelect={handlePersonSelect}
        onAddNew={handleTriggerAddNewPerson}
      />
    </div>
  );
}

export default AthletesForm;
