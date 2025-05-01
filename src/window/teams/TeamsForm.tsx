// src/form/TeamsForm.tsx

import React from 'react';
import { useFormContext, FormMode } from '../../form/FormContext';
import { Team } from '../../models/index';
// Import Timestamp type from Firestore to check instance type
import { Timestamp } from 'firebase/firestore';
import '../../styles/form.css'; // Ensure CSS path is correct

interface TeamsFormProps {
  // Ensure formData type includes potential timestamps
  formData: Partial<
    Team & { createdAt?: Timestamp; updatedAt?: Timestamp }
  > | null;
  mode: FormMode;
}

// Helper function to format Firestore Timestamps
const formatTimestamp = (timestamp: Timestamp | undefined | null): string => {
  if (timestamp && timestamp instanceof Timestamp) {
    // Convert Firestore Timestamp to JavaScript Date and format it
    return timestamp.toDate().toLocaleString(undefined, {
      // Use browser default locale
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  return 'N/A'; // Return 'N/A' if timestamp is missing or not a Timestamp object
};

function TeamsForm({ formData, mode }: TeamsFormProps) {
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

  const isDisabled = mode === 'view' || mode === null || isSaving;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    updateFormField(name, value);
  };

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

  const teamTypes: Team['type'][] = [
    'Club',
    'Masters',
    'High School',
    'Middle School',
  ];

  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        {/* --- Identification Section --- */}
        <section>
          <p>Identification</p>
          {/* ... input fields ... */}
          <div className="field">
            <label htmlFor="code">Team Code</label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData?.code ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="nameShort">Short Name</label>
            <input
              type="text"
              id="nameShort"
              name="nameShort"
              value={formData?.nameShort ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="nameLong">Long Name</label>
            <input
              type="text"
              id="nameLong"
              name="nameLong"
              value={formData?.nameLong ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="type">Team Type</label>
            <select
              id="type"
              name="type"
              value={formData?.type ?? ''}
              onChange={handleChange}
              disabled={isDisabled}
              required
            >
              <option value="" disabled>
                -- Select Type --
              </option>
              {teamTypes.map((typeOption) => (
                <option key={typeOption} value={typeOption}>
                  {typeOption}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* --- Location Section --- */}
        <section>
          <p>Location</p>
          {/* ... input fields ... */}
          <div className="field">
            <label htmlFor="location">Location Name</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData?.location ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
            />
          </div>
          <div className="field">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData?.address ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
            />
          </div>
        </section>

        {/* --- Action Buttons Section --- */}
        <section>
          <p>Actions</p>
          {error && <div className="form-message error">{error}</div>}
          <div className="buttons">
            {/* ... Edit, Save, Cancel, Delete buttons ... */}
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

        {/* --- NEW: Timestamps Section --- */}
        {/* Only show timestamps if formData exists and has them */}
        {(formData?.createdAt || formData?.updatedAt) && (
          <section className="form-timestamps">
            {/* Use paragraph tags or spans for display */}
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

export default TeamsForm;
