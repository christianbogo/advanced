// src/window/people/PeopleForm.tsx

import React from 'react';
import { useFormContext, FormMode } from '../../form/FormContext'; // Adjust path as needed
import { Person } from '../../models/index'; // Adjust path as needed
import { Timestamp } from 'firebase/firestore';
import '../../styles/form.css'; // Adjust path as needed

// Helper function to format Firestore Timestamps (assuming similar formatting desired)
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

// Define the expected props for the component
interface PeopleFormProps {
  formData: Partial<
    Person & { createdAt?: Timestamp; updatedAt?: Timestamp }
  > | null;
  mode: FormMode;
}

function PeopleForm({ formData, mode }: PeopleFormProps) {
  // Get state and action dispatchers from FormContext
  const {
    state,
    dispatch, // Get dispatch for setting errors
    updateFormField,
    selectItemForForm,
    saveForm,
    clearForm,
    revertFormData,
    deleteItem,
  } = useFormContext();
  const { selectedItem, isSaving, error } = state; // Extract needed state

  // Determine if fields should be disabled
  const isDisabled = mode === 'view' || mode === null || isSaving;

  // Generic handler for most input/select changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Special handling for 'primaryEmail' to update the 'emails' array
    if (name === 'primaryEmail') {
      // We'll manage the 'emails' array by updating its first element.
      const currentEmails = formData?.emails ?? [];
      // Create a new array: put the new value first, keep the rest (if any)
      const newEmails = [value, ...currentEmails.slice(1)];
      updateFormField('emails', newEmails);
    } else {
      // Default handling for other fields
      updateFormField(name, value);
    }
  };

  // --- Action Handlers ---
  // These handlers are generic and rely on FormContext dispatching
  // actions based on the currently selectedItem type ('person').

  const handleEditClick = () => {
    if (selectedItem?.type === 'person' && selectedItem?.id) {
      // Switch mode to 'edit' for the current person
      selectItemForForm(selectedItem.type, selectedItem.id, 'edit');
    }
  };

  const handleCancelClick = () => {
    if (selectedItem?.mode === 'add') {
      clearForm(); // Clear everything if cancelling an 'add' operation
    } else if (selectedItem?.type === 'person' && selectedItem?.id) {
      revertFormData(); // Revert changes if editing
      selectItemForForm(selectedItem.type, selectedItem.id, 'view'); // Go back to view mode
    }
  };

  const handleSaveClick = async () => {
    if (isSaving || !formData) return;

    // Basic Validation: Check required fields
    // NOTE: Add more specific validation (e.g., email format) if needed
    if (!formData.firstName || !formData.lastName) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Please fill in all required fields (First Name, Last Name).',
      });
      return; // Prevent saving
    }

    // Clear any previous errors if validation passes
    if (error) {
      dispatch({ type: 'SET_ERROR', payload: null });
    }

    // The 'emails' field is managed via handleChange and updateFormField.
    // saveForm from context will handle the actual Firestore operation.
    await saveForm();
  };

  const handleDeleteClick = async () => {
    if (isSaving || !selectedItem?.id) return;
    // Confirmation prompt is handled within deleteItem in FormContext currently
    await deleteItem();
  };

  // Define gender options for the select dropdown
  const genderOptions: Person['gender'][] = ['M', 'F', 'O'];

  // Extract the primary email for easier binding to the input field
  // Defaults to empty string if formData or emails array is not present or empty
  const primaryEmail = formData?.emails?.[0] ?? '';

  // --- Render ---
  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        {/* --- Basic Info Section --- */}
        <section>
          <p>Basic Information</p>
          <div className="field">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData?.firstName ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="preferredName">Preferred Name</label>
            <input
              type="text"
              id="preferredName"
              name="preferredName"
              value={formData?.preferredName ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
            />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData?.lastName ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="birthday">Birthday</label>
            <input
              type="date" // Use date input type
              id="birthday"
              name="birthday"
              value={formData?.birthday ?? ''} // Expects 'YYYY-MM-DD'
              onChange={handleChange}
              readOnly={isDisabled}
            />
          </div>
          <div className="field">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={formData?.gender ?? ''}
              onChange={handleChange}
              disabled={isDisabled}
            >
              <option value="" disabled></option>
              {genderOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* --- Contact Info Section --- */}
        <section>
          <p>Contact Information</p>
          <div className="field">
            <label htmlFor="primaryEmail">Primary Email</label>
            {/* NOTE: The Person model supports an array of emails. */}
            {/* This form currently only edits the first email in the array. */}
            <input
              type="email" // Use email input type for basic browser validation
              id="primaryEmail"
              name="primaryEmail" // Custom name handled in handleChange
              value={primaryEmail} // Bind to the extracted primary email
              onChange={handleChange}
              readOnly={isDisabled}
              // Consider adding 'required' if a primary email is mandatory
            />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel" // Use tel input type
              id="phone"
              name="phone"
              value={formData?.phone ?? ''}
              onChange={handleChange}
              readOnly={isDisabled}
              placeholder="(###) ###-####" // Placeholder for phone format
            />
          </div>
        </section>

        {/* --- Action Buttons Section --- */}
        <section>
          <p>Actions</p>
          {/* Display any errors from context */}
          {error && <div className="form-message error">{error}</div>}
          <div className="buttons">
            {/* Button rendering logic is the same pattern as other forms */}
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
            {/* Show delete button only in 'edit' mode for an existing item */}
            {mode === 'edit' && selectedItem?.id && (
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={isSaving}
                className="delete" // Apply delete styling
              >
                {isSaving ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </section>

        {/* --- Timestamps Section --- */}
        {/* Display timestamps if they exist on the formData */}
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

export default PeopleForm;
