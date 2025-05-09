import React, { useState, useCallback, useMemo } from 'react'; // Added useMemo
import { useFormContext, FormMode } from '../../form/FormContext';
import { Person } from '../../types/data';
import { Timestamp } from 'firebase/firestore';
import '../../styles/form.css';

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

interface PeopleFormProps {
  formData: Partial<Person> | null; // This prop might represent initial data
  mode: FormMode;
}

function PeopleForm({ formData: initialFormDataProp, mode }: PeopleFormProps) {
  // Renamed formData prop
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
  // Always use currentFormData from context as the source of truth for display and manipulation
  const { selectedItem, isSaving, error, formData: currentFormData } = state;

  const isDisabled = mode === 'view' || mode === null || isSaving;

  const [emailInput, setEmailInput] = useState('');

  // Derived email states from currentFormData
  const allEmails = useMemo(
    () => currentFormData?.emails ?? [],
    [currentFormData?.emails]
  );
  const primaryEmailValue = useMemo(() => allEmails[0] ?? '', [allEmails]);
  const secondaryEmails = useMemo(() => allEmails.slice(1), [allEmails]);

  // Generic handler for most input fields
  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target;
      updateFormField(name as keyof Person, value);
    },
    [updateFormField]
  );

  const handlePrimaryEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newPrimaryEmail = e.target.value.trim();
      // Ensure currentEmailsList is from the reliable allEmails memoized value
      const currentEmailsList = allEmails;
      let updatedEmails: string[];

      // Remove newPrimaryEmail from the rest of the list to ensure uniqueness if it exists there
      const otherEmails = currentEmailsList
        .slice(1)
        .filter(
          (email: string) =>
            email.toLowerCase() !== newPrimaryEmail.toLowerCase()
        );

      if (!newPrimaryEmail) {
        // Primary email is being cleared
        updatedEmails = otherEmails; // Other emails become the new list (first one becomes primary if any)
      } else {
        // Primary email has a value
        updatedEmails = [newPrimaryEmail, ...otherEmails];
      }
      updateFormField('emails', updatedEmails);
    },
    [allEmails, updateFormField] // Depends on allEmails
  );

  const handleAddEmail = useCallback(() => {
    const trimmedEmailInput = emailInput.trim();
    if (!trimmedEmailInput) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmailInput)) {
      // Consider dispatching a user-friendly error:
      // dispatch({ type: 'SET_ERROR', payload: 'Invalid email format.' });
      alert('Invalid email format.'); // Simple alert for now
      return;
    }

    // Case-insensitive check for existing emails
    if (
      allEmails.some(
        (email: string) =>
          email.toLowerCase() === trimmedEmailInput.toLowerCase()
      )
    ) {
      // dispatch({ type: 'SET_ERROR', payload: 'Email already exists.' });
      alert('Email already exists.'); // Simple alert for now
      return;
    }

    const updatedEmails = [...allEmails, trimmedEmailInput];
    updateFormField('emails', updatedEmails);
    setEmailInput('');
    if (error) dispatch({ type: 'SET_ERROR', payload: null }); // Clear previous errors
  }, [emailInput, allEmails, updateFormField, dispatch, error]);

  const handleRemoveEmail = useCallback(
    (emailToRemove: string) => {
      // Case-insensitive removal
      const updatedEmails = allEmails.filter(
        (email: string) => email.toLowerCase() !== emailToRemove.toLowerCase()
      );
      updateFormField('emails', updatedEmails);
    },
    [allEmails, updateFormField]
  );

  const handleEditClick = useCallback(() => {
    if (selectedItem?.type === 'person' && selectedItem?.id) {
      selectItemForForm(selectedItem.type, selectedItem.id, 'edit');
    }
  }, [selectedItem, selectItemForForm]);

  const handleCancelClick = useCallback(() => {
    if (selectedItem?.mode === 'add') {
      clearForm();
    } else if (selectedItem?.type === 'person' && selectedItem?.id) {
      revertFormData(); // This should restore currentFormData in context to its original state
      selectItemForForm(selectedItem.type, selectedItem.id, 'view');
    }
  }, [selectedItem, clearForm, revertFormData, selectItemForForm]);

  const handleSaveClick = useCallback(async () => {
    if (isSaving || !currentFormData) return;

    if (!currentFormData.firstName || !currentFormData.lastName) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Please fill in all required fields (First Name, Last Name).',
      });
      return;
    }
    // Ensure primary email is valid if present (optional, can be enforced by backend too)
    if (
      primaryEmailValue &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryEmailValue)
    ) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Primary email format is invalid.',
      });
      return;
    }

    if (error) dispatch({ type: 'SET_ERROR', payload: null });
    await saveForm();
  }, [isSaving, currentFormData, primaryEmailValue, dispatch, error, saveForm]);

  const handleDeleteClick = useCallback(async () => {
    if (isSaving || !selectedItem?.id) return;
    await deleteItem();
  }, [isSaving, selectedItem, deleteItem]);

  const genderOptions: Person['gender'][] = ['M', 'F', 'O'];

  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        <section>
          <p className="form-section-title">Basic Information</p>
          <div className="field">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={currentFormData?.firstName ?? ''}
              onChange={handleInputChange}
              readOnly={isDisabled}
              required
              aria-required="true"
            />
          </div>
          <div className="field">
            <label htmlFor="preferredName">Preferred Name</label>
            <input
              type="text"
              id="preferredName"
              name="preferredName"
              value={currentFormData?.preferredName ?? ''}
              onChange={handleInputChange}
              readOnly={isDisabled}
            />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={currentFormData?.lastName ?? ''}
              onChange={handleInputChange}
              readOnly={isDisabled}
              required
              aria-required="true"
            />
          </div>
          <div className="field">
            <label htmlFor="birthday">Birthday</label>
            <input
              type="date"
              id="birthday"
              name="birthday"
              value={currentFormData?.birthday ?? ''}
              onChange={handleInputChange}
              readOnly={isDisabled}
            />
          </div>
          <div className="field">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={currentFormData?.gender ?? ''}
              onChange={handleInputChange}
              disabled={isDisabled}
            >
              <option value="">Select Gender</option>
              {genderOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <p className="form-section-title">Contact Information</p>
          <div className="field">
            <label htmlFor="primaryEmailField">Primary Email</label>{' '}
            {/* Changed id to avoid conflict */}
            <input
              type="email"
              id="primaryEmailField"
              name="primaryEmail" // Keep name for potential future use, though onChange is specific
              value={primaryEmailValue}
              onChange={handlePrimaryEmailChange}
              readOnly={isDisabled}
              placeholder="Enter primary email"
            />
          </div>

          <div className="field-group emails-management">
            <label htmlFor="emailToAddInput">Additional Emails</label>{' '}
            {/* Changed id */}
            <div className="add-email-control">
              <input
                type="email"
                id="emailToAddInput" // Changed id
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter additional email"
                readOnly={isDisabled}
                aria-label="Email to add"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                disabled={isDisabled || !emailInput.trim()}
                className="btn-add-email"
              >
                Add
              </button>
            </div>
            {secondaryEmails.length > 0 && (
              <ul className="email-list">
                {secondaryEmails.map(
                  (
                    email: string // Index not needed for key if emails are unique
                  ) => (
                    <li key={email} className="email-item">
                      {' '}
                      {/* Use email as key if unique */}
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        disabled={isDisabled}
                        className="btn-remove-email"
                        aria-label={`Remove ${email}`}
                      >
                        &times;
                      </button>
                    </li>
                  )
                )}
              </ul>
            )}
            {allEmails.length === 0 && !isDisabled && (
              <p className="empty-message">No email addresses entered.</p>
            )}
            {allEmails.length > 0 &&
              secondaryEmails.length === 0 &&
              !isDisabled && (
                <p className="empty-message">No additional emails added yet.</p>
              )}
          </div>

          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={currentFormData?.phone ?? ''}
              onChange={handleInputChange}
              readOnly={isDisabled}
              placeholder="(###) ###-####"
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
    </div>
  );
}

export default PeopleForm;
