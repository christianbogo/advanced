// src/window/athletes/AthletesForm.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useFormContext, FormMode } from '../../form/FormContext'; // Adjust path
import { useFilterContext } from '../../filter/FilterContext'; // Correctly importing FilterContext hook
import { Athlete, Person, Team, Season } from '../../models/index'; // Adjust path
import { Timestamp } from 'firebase/firestore';
// Hooks for dropdown data
import { useTeams } from '../teams/useTeams'; // Adjust path
import { useSeasons, SeasonWithTeamInfo } from '../seasons/useSeasons'; // Adjust path
// Import the modal component
import PersonSelectorModal from '../persons/PersonSelectorModal'; // Adjust path
import '../../styles/form.css'; // Adjust path

// Helper function (assume available/imported)
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

// Define props including assumed Person details fetched by the container
interface AthletesFormProps {
  formData: Partial<
    Athlete & {
      createdAt?: Timestamp;
      updatedAt?: Timestamp;
      personFirstName?: string;
      personLastName?: string;
      personPreferredName?: string;
    }
  > | null;
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

  // *** Get FilterContext state - Correctly using the hook ***
  const { state: filterState } = useFilterContext();

  // --- State for Person Selector Modal ---
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);

  // --- Data Fetching for Dropdowns ---
  const { data: teams, isLoading: isLoadingTeams } = useTeams();
  const { data: allSeasons, isLoading: isLoadingSeasons } = useSeasons();

  // --- Memos ---
  const isDisabled = mode === 'view' || mode === null || isSaving;

  const availableSeasons = useMemo(() => {
    if (!allSeasons || !currentFormData?.team) return [];
    return allSeasons.filter((season) => season.team === currentFormData.team);
  }, [allSeasons, currentFormData?.team]);

  const selectedPersonName = useMemo(() => {
    if (!currentFormData?.person) return 'No Person Selected';
    const currentFirstName =
      currentFormData?.personPreferredName || currentFormData?.personFirstName;
    const currentLastName = currentFormData?.personLastName;
    if (currentFirstName && currentLastName) {
      return `${currentFirstName} ${currentLastName}`;
    }
    const initialFirstName =
      formData?.personPreferredName || formData?.personFirstName;
    const initialLastName = formData?.personLastName;
    if (initialFirstName && initialLastName) {
      return `${initialFirstName} ${initialLastName}`;
    }
    return `Person ID: ${currentFormData.person}`;
  }, [
    currentFormData?.person,
    currentFormData?.personFirstName,
    currentFormData?.personLastName,
    currentFormData?.personPreferredName,
    formData?.personFirstName,
    formData?.personLastName,
    formData?.personPreferredName,
  ]);

  // --- Effect for Pre-selecting Team/Season on Add ---
  // *** Correctly uses filterState from FilterContext ***
  useEffect(() => {
    if (
      mode === 'add' &&
      !currentFormData?.team &&
      !currentFormData?.season &&
      allSeasons
    ) {
      // Accessing superSelected IDs from filterState
      const { season: superSelectedSeasonIds, team: superSelectedTeamIds } =
        filterState.superSelected;

      // console.log( // Keep logs minimal
      //   '[AthletesForm Effect] Checking pre-selection for Add mode.',
      //   { superSelectedSeasonIds, superSelectedTeamIds }
      // );

      if (superSelectedSeasonIds.length === 1) {
        const selectedSeasonId = superSelectedSeasonIds[0];
        const seasonData = allSeasons.find((s) => s.id === selectedSeasonId);
        if (seasonData && seasonData.team) {
          // console.log( // Keep logs minimal
          //   `[AthletesForm Effect] Pre-selecting Season ${selectedSeasonId} and Team ${seasonData.team}`
          // );
          updateFormField('season', selectedSeasonId);
          updateFormField('team', seasonData.team);
        } else {
          // console.warn( // Keep logs minimal
          //   `[AthletesForm Effect] Could not find team data for super-selected season ${selectedSeasonId}`
          // );
        }
      } else if (superSelectedTeamIds.length === 1) {
        const selectedTeamId = superSelectedTeamIds[0];
        // console.log( // Keep logs minimal
        //   `[AthletesForm Effect] Pre-selecting Team ${selectedTeamId}`
        // );
        updateFormField('team', selectedTeamId);
      }
      // else { // Keep logs minimal
      //   console.log(
      //     '[AthletesForm Effect] No single Team/Season super-selected, skipping pre-selection.'
      //   );
      // }
    }
  }, [
    mode,
    filterState.superSelected.season, // Dependency on filterState
    filterState.superSelected.team, // Dependency on filterState
    allSeasons,
    updateFormField,
    currentFormData?.team,
    currentFormData?.season,
  ]);

  // --- Event Handlers (remain unchanged) ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormField(e.target.name, e.target.value);
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTeamId = e.target.value;
    updateFormField('team', newTeamId);
    const currentSeasonId = currentFormData?.season;
    if (currentSeasonId) {
      const seasonBelongsToNewTeam =
        allSeasons?.find((s) => s.id === currentSeasonId)?.team === newTeamId;
      if (!seasonBelongsToNewTeam) {
        updateFormField('season', '');
      }
    }
  };

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFormField('season', e.target.value);
  };

  const handleOpenPersonModal = () => {
    if (!isDisabled) setIsPersonModalOpen(true);
  };
  const handleClosePersonModal = () => setIsPersonModalOpen(false);

  const handlePersonSelect = (
    selectedPerson: Pick<
      Person,
      'id' | 'firstName' | 'lastName' | 'preferredName'
    >
  ) => {
    updateFormField('person', selectedPerson.id);
    updateFormField('personFirstName', selectedPerson.firstName ?? null);
    updateFormField('personLastName', selectedPerson.lastName ?? null);
    updateFormField(
      'personPreferredName',
      selectedPerson.preferredName ?? null
    );
    setIsPersonModalOpen(false);
  };

  const handleTriggerAddNewPerson = () => {
    selectItemForForm('person', null, 'add');
  };

  const handleEditClick = () => {
    if (selectedItem?.type === 'athlete' && selectedItem?.id) {
      selectItemForForm(selectedItem.type, selectedItem.id, 'edit');
    }
  };
  const handleCancelClick = () => {
    if (selectedItem?.mode === 'add') {
      clearForm();
    } else if (selectedItem?.type === 'athlete' && selectedItem?.id) {
      revertFormData();
      selectItemForForm(selectedItem.type, selectedItem.id, 'view');
    }
  };
  const handleDeleteClick = async () => {
    if (isSaving || !selectedItem?.id) return;
    await deleteItem();
  };

  const handleSaveClick = async () => {
    if (isSaving || !currentFormData) return;
    if (
      !currentFormData.person ||
      !currentFormData.team ||
      !currentFormData.season
    ) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'A Person, Team, and Season must be selected.',
      });
      return;
    }
    if (error) {
      dispatch({ type: 'SET_ERROR', payload: null });
    }
    await saveForm();
  };

  // --- Render (remains unchanged) ---
  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        {/* Person Selection */}
        <section>
          <p>Person</p>
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
            !currentFormData?.person && (
              <p className="field-hint subtle">Search or add person.</p>
            )}
        </section>

        {/* Team & Season Selection */}
        <section>
          <p>Team & Season Assignment</p>
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
                {isLoadingTeams ? 'Loading Teams...' : '-- Select Team --'}
              </option>
              {teams?.map((team) => (
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
              value={currentFormData?.season ?? ''}
              onChange={handleSeasonChange}
              disabled={
                !currentFormData?.team || isDisabled || isLoadingSeasons
              }
              required
            >
              <option value="" disabled>
                {isLoadingSeasons
                  ? 'Loading Seasons...'
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
        </section>

        {/* Athlete Specific Details */}
        <section>
          <p>Athlete Details (Optional)</p>
          <div className="field">
            <label htmlFor="grade">Grade</label>
            <input
              type="text"
              id="grade"
              name="grade"
              value={currentFormData?.grade ?? ''}
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
              readOnly={isDisabled}
            />
          </div>
        </section>

        {/* Actions Section */}
        <section>
          <p>Actions</p>
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

        {/* Timestamps Section */}
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

      {/* Modal Rendering */}
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
