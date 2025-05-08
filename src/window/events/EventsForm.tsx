// src/window/events/EventsForm.tsx

import React from 'react';
import { useFormContext, FormMode } from '../../form/FormContext';
import { Event } from '../../models/index';
import { Timestamp } from 'firebase/firestore';
import '../../styles/form.css'; // Ensure CSS path is correct

interface EventsFormProps {
  formData: Partial<
    Event & { createdAt?: Timestamp; updatedAt?: Timestamp }
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

// Options for dropdowns
const courseOptions: Event['course'][] = ['SCY', 'LCM', 'Other'];
const strokeOptions: Event['stroke'][] = [
  'Medley',
  'Fly',
  'Back',
  'Breast',
  'Free',
  'Free Relay',
  'Medley Relay',
  'Other',
];
const booleanOptions = [
  { label: 'Official', value: 'true' },
  { label: 'Unofficial', value: 'false' },
];

function EventsForm({ formData, mode }: EventsFormProps) {
  const {
    state,
    updateFormField,
    selectItemForForm,
    saveForm,
    clearForm,
    revertFormData,
    deleteItem,
    dispatch, // <<< Added dispatch for setting errors locally
  } = useFormContext();
  const { selectedItem, isSaving, error } = state;

  const isDisabled = mode === 'view' || mode === null || isSaving;

  // --- Event Handlers ---
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    let processedValue: any = value;

    // Handle checkbox type explicitly if needed in future, but dropdown used here
    // if (type === 'checkbox') {
    //   processedValue = (e.target as HTMLInputElement).checked;
    // }

    // Handle number conversion for distance
    if (name === 'distance') {
      processedValue = value === '' ? null : Number(value); // Store as number or null if empty
    }

    // Handle boolean conversion for dropdowns
    if (['hs', 'ms', 'U14', 'O15'].includes(name)) {
      processedValue = value === 'true'; // Convert "true"/"false" string to boolean
    }

    updateFormField(name, processedValue);
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
      revertFormData(); // Revert changes in context state
      // No need to call selectItemForForm again, revertFormData keeps the item selected
      // Just ensure the mode is reset if necessary, which SAVE_SUCCESS/DELETE_SUCCESS/clearForm do
      // We might need to explicitly switch back to view mode if revert is called standalone
      selectItemForForm(selectedItem.type, selectedItem.id, 'view'); // Switch back to view explicitly
    } else {
      clearForm(); // Fallback if state is somehow inconsistent
    }
  };

  // --- Validation Logic ---
  const validateForm = (): boolean => {
    if (!formData) return false; // Should not happen if saving

    const requiredFields: (keyof Event)[] = [
      'code',
      'nameShort',
      'nameLong',
      'course',
      'distance',
      'stroke',
    ];
    for (const field of requiredFields) {
      // Check for null, undefined, or empty string (and distance <= 0)
      const value = formData[field];
      if (value === null || value === undefined || value === '') {
        dispatch({
          type: 'SET_ERROR',
          payload: `Field '${field}' is required.`,
        });
        return false;
      }
      if (field === 'distance' && (typeof value !== 'number' || value <= 0)) {
        dispatch({
          type: 'SET_ERROR',
          payload: `Field 'distance' must be a positive number.`,
        });
        return false;
      }
    }

    // Specific distance validation
    if (
      formData.distance &&
      (formData.distance <= 0 || formData.distance % 25 !== 0)
    ) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Distance must be a positive multiple of 25.',
      });
      return false;
    }

    // If all checks pass
    dispatch({ type: 'SET_ERROR', payload: null }); // Clear any previous validation errors
    return true;
  };

  const handleSaveClick = async () => {
    if (isSaving) return;
    if (validateForm()) {
      await saveForm(); // Call context's save function
    }
    // If validation fails, the error is set in validateForm via dispatch
  };

  const handleDeleteClick = async () => {
    if (isSaving) return;
    // Add confirmation specific to the item being deleted
    const eventIdentifier =
      formData?.code || formData?.nameShort || selectedItem?.id || 'this event';
    if (
      window.confirm(
        `Are you sure you want to delete ${eventIdentifier}? This action cannot be undone.`
      )
    ) {
      await deleteItem(); // Call context's delete function
    }
  };

  // --- Render ---
  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        {/* --- Identification Section --- */}
        <section>
          <p>Identification</p>
          <div className="field">
            <label htmlFor="code">Event Code</label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData?.code ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
              required
              aria-required="true"
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
              aria-required="true"
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
              aria-required="true"
            />
          </div>
        </section>

        {/* --- Details Section --- */}
        <section>
          <p>Details</p>
          <div className="field">
            <label htmlFor="course">Course</label>
            <select
              id="course"
              name="course"
              value={formData?.course ?? ''}
              onChange={handleChange}
              disabled={isDisabled}
              required
              aria-required="true"
            >
              <option value="" disabled>
                Select course...
              </option>
              {courseOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="distance">Distance</label>
            <input
              type="number"
              id="distance"
              name="distance"
              value={formData?.distance ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
              required
              aria-required="true"
              step="25"
              min="25" // Basic HTML5 validation hint
            />
          </div>
          <div className="field">
            <label htmlFor="stroke">Stroke</label>
            <select
              id="stroke"
              name="stroke"
              value={formData?.stroke ?? ''}
              onChange={handleChange}
              disabled={isDisabled}
              required
              aria-required="true"
            >
              <option value="" disabled>
                Select stroke...
              </option>
              {strokeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* --- Classifications Section --- */}
        <section>
          <p>Classifications</p>
          {/* Map boolean fields to dropdowns */}
          {(['hs', 'ms', 'U14', 'O15'] as const).map((fieldName) => (
            <div className="field" key={fieldName}>
              <label htmlFor={fieldName}>
                {/* Simple label generation */}
                {fieldName === 'hs' && 'High School'}
                {fieldName === 'ms' && 'Middle School'}
                {fieldName === 'U14' && 'Club U14'}
                {fieldName === 'O15' && 'Club O15'}
              </label>
              <select
                id={fieldName}
                name={fieldName}
                // Convert boolean value to string 'true'/'false' for select value
                value={String(formData?.[fieldName] ?? false)} // Default to false if undefined
                onChange={handleChange}
                disabled={isDisabled}
              >
                {booleanOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </section>

        {/* --- Action Buttons Section --- */}
        <section>
          <p>Actions</p>
          {/* Display validation or save/load errors from context */}
          {error && <div className="form-message error">{error}</div>}
          {/* Display Saving message */}
          {isSaving && <div className="form-message">Processing...</div>}

          <div className="buttons">
            {/* Edit Button (View Mode) */}
            {mode === 'view' && selectedItem?.id && (
              <button
                type="button"
                onClick={handleEditClick}
                disabled={isSaving}
              >
                Edit
              </button>
            )}
            {/* Save/Cancel Buttons (Edit/Add Mode) */}
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
            {/* Delete Button (Edit Mode) */}
            {mode === 'edit' && selectedItem?.id && (
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={isSaving}
                className="delete" // Add class for styling delete button
              >
                {/* No need for 'Deleting...' text change as isSaving covers the state */}
                Delete
              </button>
            )}
            {/* Delete Button (Also available in View Mode for consistency?) */}
            {mode === 'view' && selectedItem?.id && (
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={isSaving}
                className="delete"
              >
                Delete
              </button>
            )}
          </div>
        </section>

        {/* --- Timestamps Section --- */}
        {(formData?.createdAt || formData?.updatedAt) && mode !== 'add' && (
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

export default EventsForm;
