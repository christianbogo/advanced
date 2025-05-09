import React, { useCallback } from 'react';
import { useFormContext, FormMode } from '../../form/FormContext';
import { Season, Team } from '../../types/data';
import { useTeams } from '../teams/useTeams'; // Assuming this path is correct
import { Timestamp } from 'firebase/firestore';
import '../../styles/form.css';

interface SeasonsFormProps {
  formData: Partial<Season> | null;
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

function SeasonsForm({ formData, mode }: SeasonsFormProps) {
  const {
    state,
    updateFormField,
    selectItemForForm,
    saveForm,
    clearForm,
    revertFormData,
    deleteItem,
  } = useFormContext();
  const { selectedItem, isSaving, error } = state;

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
      updateFormField(name, value);
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
      revertFormData();
      selectItemForForm(selectedItem.type, selectedItem.id, 'view');
    }
  };

  const handleSaveClick = async () => {
    if (isSaving) return;
    await saveForm();
  };

  const handleDeleteClick = async () => {
    if (isSaving) return;
    await deleteItem();
  };

  const quarterOptions: Season['quarter'][] = [
    'Spring',
    'Summer',
    'Fall',
    'Winter',
  ];

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
              value={formData?.team?.id ?? ''}
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
              value={formData?.quarter ?? ''}
              onChange={handleGenericFieldChange}
              disabled={isDisabled}
              required
              aria-required="true"
            >
              <option value="" disabled></option>
              {quarterOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="year">Year</label>
            <input
              type="text"
              id="year"
              name="year"
              placeholder="YYYY or YYYY-YYYY"
              value={formData?.year ?? ''}
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
              value={formData?.startDate ?? ''}
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
              value={formData?.endDate ?? ''}
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
                formData?.dataComplete === undefined
                  ? ''
                  : String(formData.dataComplete)
              }
              onChange={handleDataCompleteChange}
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

        {(formData?.createdAt || formData?.updatedAt) && (
          <section className="form-timestamps">
            {formData.createdAt && (
              <p className="timestamp-field">
                Created: {formatTimestamp(formData.createdAt)}
              </p>
            )}
            {formData.updatedAt && (
              <p className="timestamp-field">
                Updated: {formatTimestamp(formData.updatedAt)}
              </p>
            )}
          </section>
        )}
      </form>
    </div>
  );
}

export default SeasonsForm;
