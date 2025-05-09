// src/window/athletes/AthletesForm.tsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useFormContext, FormMode } from '../../form/FormContext';
import { useFilterContext } from '../../filter/FilterContext';
import { Athlete, Person, Team, Season } from '../../types/data';
import { Timestamp } from 'firebase/firestore';
import { useTeams } from '../teams/useTeams';
import { useSeasons } from '../seasons/useSeasons';
import PersonSelectorModal from '../persons/PersonSelectorModal'; // Assuming path is correct
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
  formData: Partial<Athlete> | null; // Simplified
  mode: FormMode;
}

function AthletesForm({ formData, mode }: AthletesFormProps) {
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
  const { state: filterState } = useFilterContext();

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);

  const { data: teamsData, isLoading: isLoadingTeams } = useTeams();
  const { data: allSeasonsData, isLoading: isLoadingSeasons } = useSeasons();

  const isDisabled = mode === 'view' || mode === null || isSaving;

  const availableSeasons = useMemo(() => {
    const currentTeam = currentFormData?.team as Team | undefined;
    if (!allSeasonsData || !currentTeam?.id) {
      return [];
    }
    return allSeasonsData.filter((season) => season.team.id === currentTeam.id);
  }, [allSeasonsData, currentFormData?.team]);

  const selectedPersonName = useMemo(() => {
    const person = currentFormData?.person as Person | undefined;
    if (!person?.id) return 'No Person Selected';
    const firstName = person.preferredName || person.firstName;
    const lastName = person.lastName;
    return (
      `${firstName ?? ''} ${lastName ?? ''}`.trim() || `Person ID: ${person.id}`
    );
  }, [currentFormData?.person]);

  useEffect(() => {
    // Pre-select team/season in 'add' mode based on filter context
    if (
      mode === 'add' &&
      !currentFormData?.team &&
      !currentFormData?.season &&
      teamsData &&
      allSeasonsData
    ) {
      const { season: superSelectedSeasonIds, team: superSelectedTeamIds } =
        filterState.superSelected;

      if (superSelectedSeasonIds.length === 1) {
        const selectedSeasonId = superSelectedSeasonIds[0];
        const seasonObject = allSeasonsData.find(
          (s) => s.id === selectedSeasonId
        );
        if (seasonObject?.team) {
          // Ensure season and its embedded team are found
          updateFormField('season', seasonObject);
          updateFormField('team', seasonObject.team); // Use the embedded team object
        }
      } else if (superSelectedTeamIds.length === 1) {
        const selectedTeamId = superSelectedTeamIds[0];
        const teamObject = teamsData.find((t) => t.id === selectedTeamId);
        if (teamObject) {
          updateFormField('team', teamObject); // Store the team object
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    filterState.superSelected.season,
    filterState.superSelected.team,
    allSeasonsData,
    teamsData,
    updateFormField,
    currentFormData?.team,
    currentFormData?.season,
  ]);

  const handleGenericFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFormField(e.target.name, e.target.value);
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

  const handleOpenPersonModal = useCallback(() => {
    if (!isDisabled) setIsPersonModalOpen(true);
  }, [isDisabled]);

  const handleClosePersonModal = useCallback(
    () => setIsPersonModalOpen(false),
    []
  );

  const handlePersonSelect = useCallback(
    (selectedPerson: Person) => {
      updateFormField('person', selectedPerson); // Store the full Person object
      setIsPersonModalOpen(false);
    },
    [updateFormField]
  );

  const handleTriggerAddNewPerson = useCallback(() => {
    selectItemForForm('person', null, 'add');
    // Keep the Athlete form open; context/viewport handles potential focus shift
  }, [selectItemForForm]);

  const handleEditClick = useCallback(() => {
    if (selectedItem?.type === 'athlete' && selectedItem?.id) {
      selectItemForForm(selectedItem.type, selectedItem.id, 'edit');
    }
  }, [selectedItem, selectItemForForm]);

  const handleCancelClick = useCallback(() => {
    if (selectedItem?.mode === 'add') {
      clearForm();
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
    const teamObject = currentFormData.team as Team | undefined;
    const seasonObject = currentFormData.season as Season | undefined;
    const personObject = currentFormData.person as Person | undefined;

    // Validate that embedded objects have been selected
    if (!personObject?.id || !teamObject?.id || !seasonObject?.id) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'A Person, Team, and Season must be selected.',
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
          <p className="form-section-title">Person</p>
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
                  ? 'Loading Seasons...'
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
        </section>

        <section>
          <p className="form-section-title">Athlete Details (Optional)</p>
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
                  {' '}
                  {isSaving ? 'Saving...' : 'Save'}{' '}
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
