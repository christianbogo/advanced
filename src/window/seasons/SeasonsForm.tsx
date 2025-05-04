// src/form/SeasonsForm.tsx

import React from 'react';
// Import context hook and type
import { useFormContext, FormMode } from '../../form/FormContext';
// Import data models
import { Season, Team } from '../../models/index'; // Adjust path as needed
// Import hook to fetch teams for the dropdown
import { useTeams } from '../teams/useTeams'; // Adjust path as needed
// Import Timestamp type from Firestore to check instance type
import { Timestamp } from 'firebase/firestore';
// Import CSS - Adjust path if necessary
import '../../styles/form.css'; // Ensure CSS path is correct

// Define the expected props for the component
interface SeasonsFormProps {
  // Ensure formData type includes potential timestamps
  formData: Partial<
    Season & { createdAt?: Timestamp; updatedAt?: Timestamp }
  > | null;
  mode: FormMode;
}

// Helper function to format Firestore Timestamps (can be moved to a utils file)
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
  // Get state and action dispatchers from FormContext
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

  // Fetch teams data for the dropdown
  const { data: teams, isLoading: isLoadingTeams } = useTeams();

  // Determine if fields should be disabled
  const isDisabled = mode === 'view' || mode === null || isSaving;

  // Generic handler for input/select changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    // Handle checkbox type specifically if added later
    const finalValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    updateFormField(name, finalValue);
  };

  // Action handlers (remain generic, context handles type-specific logic)
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
    // Add any Season-specific validation here before calling saveForm if needed
    await saveForm();
  };

  const handleDeleteClick = async () => {
    if (isSaving) return;
    await deleteItem();
  };

  // Define the possible season names
  const seasonNames: Season['season'][] = [
    'Spring',
    'Summer',
    'Fall',
    'Winter',
  ];

  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        {/* --- Season Details Section --- */}
        <section>
          <p>Season Details</p>
          <div className="field">
            <label htmlFor="team">Team</label>
            <select
              id="team"
              name="team" // Matches the field name in the Season model
              value={formData?.team ?? ''} // Bind value (should be team ID)
              onChange={handleChange}
              disabled={isDisabled || isLoadingTeams} // Disable if loading teams or in view mode
              required
            >
              <option value="" disabled>
                {isLoadingTeams ? 'Loading Teams...' : '-- Select Team --'}
              </option>
              {/* Populate options from fetched teams data */}
              {teams?.map((team: Team) => (
                <option key={team.id} value={team.id}>
                  {team.code} - {team.nameShort}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="season">Season Name</label>
            <select
              id="season"
              name="season"
              value={formData?.season ?? ''}
              onChange={handleChange}
              disabled={isDisabled}
              required
            >
              <option value="" disabled>
                {' '}
                -- Select Season --{' '}
              </option>
              {seasonNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="year">Year</label>
            <input
              type="text" // Consider pattern validation e.g., "YYYY" or "YYYY-YYYY"
              id="year"
              name="year"
              placeholder="e.g., 2024 or 2024-2025"
              value={formData?.year ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
              required
            />
          </div>
        </section>

        {/* --- Dates Section --- */}
        <section>
          <p>Dates</p>
          <div className="field">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date" // Use standard date input
              id="startDate"
              name="startDate"
              value={formData?.startDate ?? ''} // Expects 'YYYY-MM-DD'
              onChange={handleChange}
              readOnly={isDisabled}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date" // Use standard date input
              id="endDate"
              name="endDate"
              value={formData?.endDate ?? ''} // Expects 'YYYY-MM-DD'
              onChange={handleChange}
              readOnly={isDisabled}
              required
            />
          </div>
          {/* Optional: dataComplete field */}
          {/* Consider using a select or checkbox */}
          <div className="field">
            <label htmlFor="dataComplete">Data Complete?</label>
            <select
              id="dataComplete"
              name="dataComplete"
              // Convert boolean to string for select value
              value={
                formData?.dataComplete === undefined
                  ? ''
                  : String(formData.dataComplete)
              }
              onChange={(e) =>
                updateFormField('dataComplete', e.target.value === 'true')
              } // Convert back to boolean
              disabled={isDisabled}
            >
              <option value="" disabled>
                -- Select Status --
              </option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </section>

        {/* --- Action Buttons Section --- */}
        <section>
          <p>Actions</p>
          {error && <div className="form-message error">{error}</div>}
          <div className="buttons">
            {/* (Button rendering logic remains the same) */}
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

        {/* --- Timestamps Section --- */}
        {(formData?.createdAt || formData?.updatedAt) && (
          <section className="form-timestamps">
            {formData.createdAt && (
              <p>Created: {formatTimestamp(formData.createdAt)}</p>
            )}
            {formData.updatedAt && (
              <p>Updated: {formatTimestamp(formData.updatedAt)}</p>
            )}
          </section>
        )}
      </form>
    </div>
  );
}

export default SeasonsForm;
