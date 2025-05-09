import React, { useCallback, useMemo } from 'react'; // Added useMemo
import { useFormContext, FormMode } from '../../form/FormContext';
import { Season, Team } from '../../types/data';
import { useTeams } from '../teams/useTeams';
import { Timestamp } from 'firebase/firestore';
import '../../styles/form.css';

interface SeasonsFormProps {
  formData: Partial<Season> | null; // Initial data for the form
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

function SeasonsForm({ formData: initialFormData, mode }: SeasonsFormProps) {
  // Renamed prop to avoid confusion
  const {
    state,
    updateFormField,
    selectItemForForm,
    saveForm,
    clearForm,
    revertFormData,
    deleteItem,
  } = useFormContext();
  // Use currentFormData from context for live form values
  const { selectedItem, isSaving, error, formData: currentFormData } = state;

  const { data: teams, isLoading: isLoadingTeams } = useTeams();
  const isDisabled = mode === 'view' || mode === null || isSaving;

  const handleTeamChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const teamId = event.target.value;
      if (teamId === '') {
        updateFormField('team', null);
        return;
      }
      const selectedTeamObject = teams?.find((t) => t.id === teamId);
      if (selectedTeamObject) {
        updateFormField('team', selectedTeamObject);
      }
    },
    [teams, updateFormField]
  );

  const handleGenericFieldChange = useCallback(
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = event.target;
      // Ensure 'year' is treated as string, even if numeric, matching Season type
      if (name === 'year') {
        updateFormField(name as keyof Season, String(value));
      } else {
        updateFormField(name as keyof Season, value);
      }
    },
    [updateFormField]
  );

  const handleDataCompleteChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      updateFormField('dataComplete', event.target.value === 'true');
    },
    [updateFormField]
  );

  const handleEditClick = () => {
    if (selectedItem?.type && selectedItem?.id) {
      selectItemForForm(selectedItem.type, selectedItem.id, 'edit');
    }
  };

  const handleCancelClick = () => {
    if (selectedItem?.mode === 'add') {
      clearForm();
    } else if (selectedItem?.type && selectedItem?.id) {
      revertFormData(); // This should repopulate currentFormData via context
      selectItemForForm(selectedItem.type, selectedItem.id, 'view');
    }
  };

  const handleSaveClick = async () => {
    if (isSaving || !areAllFieldsFilled) return; // Also check areAllFieldsFilled here as a safeguard
    await saveForm();
  };

  const handleDeleteClick = async () => {
    if (isSaving) return;
    await deleteItem();
  };

  const quarterOptions: Array<Season['quarter']> = [
    // Explicitly type array elements
    'Spring',
    'Summer',
    'Fall',
    'Winter',
  ];

  const areAllFieldsFilled = useMemo(() => {
    if (!currentFormData) return false;

    const { team, quarter, year, startDate, endDate, dataComplete } =
      currentFormData;

    const isTeamSelected = !!team?.id;
    const isQuarterSelected = !!quarter && quarter.trim() !== '';
    const isYearEntered = !!year && year.trim() !== ''; // Year is a string
    const isStartDateEntered = !!startDate;
    const isEndDateEntered = !!endDate;
    const isDataCompleteSet = typeof dataComplete === 'boolean';

    return (
      isTeamSelected &&
      isQuarterSelected &&
      isYearEntered &&
      isStartDateEntered &&
      isEndDateEntered &&
      isDataCompleteSet
    );
  }, [currentFormData]);

  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        <section>
          <p className="form-section-title">Season Details</p>
          <div className="field">
            <label htmlFor="team">Team</label>
            <select
              id="team"
              name="team"
              value={currentFormData?.team?.id ?? ''}
              onChange={handleTeamChange}
              disabled={isDisabled || isLoadingTeams}
              required
              aria-required="true"
            >
              <option value="" disabled>
                {isLoadingTeams ? 'Loading teams...' : 'Select a Team'}
              </option>
              {teams?.map((team: Team) => (
                <option key={team.id} value={team.id}>
                  {team.code} - {team.nameShort}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="quarter">Season Name</label>
            <select
              id="quarter"
              name="quarter"
              value={currentFormData?.quarter ?? ''}
              onChange={handleGenericFieldChange}
              disabled={isDisabled}
              required
              aria-required="true"
            >
              <option value="" disabled></option>
              {quarterOptions.map(
                (name) =>
                  name && (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  )
              )}
            </select>
          </div>
          <div className="field">
            <label htmlFor="year">Year</label>
            <input
              type="text"
              id="year"
              name="year"
              placeholder="YYYY or YYYY-YYYY"
              value={currentFormData?.year ?? ''}
              onChange={handleGenericFieldChange}
              readOnly={isDisabled}
              required
              aria-required="true"
            />
          </div>
        </section>

        <section>
          <p className="form-section-title">Dates</p>
          <div className="field">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={currentFormData?.startDate ?? ''}
              onChange={handleGenericFieldChange}
              readOnly={isDisabled}
              required
              aria-required="true"
            />
          </div>
          <div className="field">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={currentFormData?.endDate ?? ''}
              onChange={handleGenericFieldChange}
              readOnly={isDisabled}
              required
              aria-required="true"
            />
          </div>
          <div className="field">
            <label htmlFor="dataComplete">Data Complete?</label>
            <select
              id="dataComplete"
              name="dataComplete"
              value={
                currentFormData?.dataComplete === undefined // Bind to currentFormData
                  ? ''
                  : String(currentFormData.dataComplete)
              }
              onChange={handleDataCompleteChange}
              disabled={isDisabled}
              // Not 'required' but logic implies a choice must be made.
              // areAllFieldsFilled ensures it's set.
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
                  disabled={isSaving || !areAllFieldsFilled} // Updated disabled state
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

        {(currentFormData?.createdAt || currentFormData?.updatedAt) && ( // Check currentFormData
          <section className="form-timestamps">
            {currentFormData?.createdAt && ( // Check currentFormData
              <p className="timestamp-field">
                Created: {formatTimestamp(currentFormData.createdAt)}
              </p>
            )}
            {currentFormData?.updatedAt && ( // Check currentFormData
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

export default SeasonsForm;
