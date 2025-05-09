import React from 'react';
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
  formData: Partial<Person> | null;
  mode: FormMode;
}

function PeopleForm({ formData, mode }: PeopleFormProps) {
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
  const { selectedItem, isSaving, error } = state;

  const isDisabled = mode === 'view' || mode === null || isSaving;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === 'primaryEmail') {
      const currentEmails = formData?.emails ?? [];
      const newEmails = [value, ...currentEmails.slice(1)];
      updateFormField('emails', newEmails);
    } else {
      updateFormField(name, value);
    }
  };

  const handleEditClick = () => {
    if (selectedItem?.type === 'person' && selectedItem?.id) {
      selectItemForForm(selectedItem.type, selectedItem.id, 'edit');
    }
  };

  const handleCancelClick = () => {
    if (selectedItem?.mode === 'add') {
      clearForm();
    } else if (selectedItem?.type === 'person' && selectedItem?.id) {
      revertFormData();
      selectItemForForm(selectedItem.type, selectedItem.id, 'view');
    }
  };

  const handleSaveClick = async () => {
    if (isSaving || !formData) return;

    if (!formData.firstName || !formData.lastName) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Please fill in all required fields (First Name, Last Name).',
      });
      return;
    }
    if (error) {
      dispatch({ type: 'SET_ERROR', payload: null });
    }
    await saveForm();
  };

  const handleDeleteClick = async () => {
    if (isSaving || !selectedItem?.id) return;
    await deleteItem();
  };

  const genderOptions: Person['gender'][] = ['M', 'F', 'O'];
  const primaryEmail = formData?.emails?.[0] ?? '';

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
              value={formData?.firstName ?? ''}
              onChange={handleChange}
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
              aria-required="true"
            />
          </div>
          <div className="field">
            <label htmlFor="birthday">Birthday</label>
            <input
              type="date"
              id="birthday"
              name="birthday"
              value={formData?.birthday ?? ''}
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

        <section>
          <p className="form-section-title">Contact Information</p>
          <div className="field">
            <label htmlFor="primaryEmail">Primary Email</label>
            <input
              type="email"
              id="primaryEmail"
              name="primaryEmail"
              value={primaryEmail}
              onChange={handleChange}
              readOnly={isDisabled}
            />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData?.phone ?? ''}
              onChange={handleChange}
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

export default PeopleForm;
