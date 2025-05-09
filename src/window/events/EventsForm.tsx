import React, { useCallback } from 'react';
import { useFormContext, FormMode } from '../../form/FormContext';
import { Event } from '../../types/data';
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

interface EventsFormProps {
  formData: Partial<Event> | null;
  mode: FormMode;
}

// Review these options based on your specific needs
const courseOptions: string[] = ['SCY', 'LCM', 'SCM', 'Other'];
const strokeOptions: string[] = [
  'FR',
  'FL',
  'BK',
  'BR',
  'IM',
  'Free Relay',
  'Medley Relay',
  'Other',
];
const booleanOptions = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];

function EventsForm({ formData, mode }: EventsFormProps) {
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

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target;
      let processedValue: any = value;
      if (name === 'distance') {
        processedValue = value === '' ? null : Number(value);
      } else if (['hs', 'ms', 'U14', 'O15'].includes(name)) {
        processedValue = value === 'true';
      }
      updateFormField(name, processedValue);
    },
    [updateFormField]
  );

  const handleEditClick = useCallback(() => {
    if (selectedItem?.type === 'event' && selectedItem?.id) {
      selectItemForForm(selectedItem.type, selectedItem.id, 'edit');
    }
  }, [selectedItem, selectItemForForm]);

  const handleCancelClick = useCallback(() => {
    if (selectedItem?.mode === 'add') {
      clearForm();
    } else if (selectedItem?.type === 'event' && selectedItem?.id) {
      revertFormData();
      selectItemForForm(selectedItem.type, selectedItem.id, 'view');
    } else {
      clearForm(); // Fallback
    }
  }, [selectedItem, clearForm, revertFormData, selectItemForForm]);

  const validateForm = useCallback((): boolean => {
    if (!formData) return false;
    const requiredFields: (keyof Event)[] = [
      'code',
      'nameShort',
      'nameLong',
      'course',
      'distance',
      'stroke',
    ];
    for (const field of requiredFields) {
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
    if (
      formData.distance &&
      (formData.distance <= 0 || !Number.isInteger(formData.distance / 25))
    ) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Distance must be a positive multiple of 25.',
      });
      return false;
    }
    if (error) dispatch({ type: 'SET_ERROR', payload: null });
    return true;
  }, [formData, dispatch, error]);

  const handleSaveClick = useCallback(async () => {
    if (isSaving) return;
    if (validateForm()) {
      await saveForm();
    }
  }, [isSaving, validateForm, saveForm]);

  const handleDeleteClick = useCallback(async () => {
    if (isSaving) return;
    const eventIdentifier =
      formData?.code || formData?.nameShort || selectedItem?.id || 'this event';
    if (
      window.confirm(
        `Are you sure you want to delete ${eventIdentifier}? This action cannot be undone.`
      )
    ) {
      await deleteItem();
    }
  }, [isSaving, formData, selectedItem, deleteItem]);

  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        <section>
          <p className="form-section-title">Identification</p>
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

        <section>
          <p className="form-section-title">Details</p>
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
              min="25"
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

        <section>
          <p className="form-section-title">Classifications</p>
          {(['hs', 'ms', 'U14', 'O15'] as const).map((fieldName) => (
            <div className="field" key={fieldName}>
              <label htmlFor={fieldName}>
                {fieldName === 'hs' && 'High School Event?'}
                {fieldName === 'ms' && 'Middle School Event?'}
                {fieldName === 'U14' && 'Club U14 Event?'}
                {fieldName === 'O15' && 'Club O15 Event?'}
              </label>
              <select
                id={fieldName}
                name={fieldName}
                value={String(formData?.[fieldName] ?? false)}
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

        <section>
          <p className="form-section-title">Actions</p>
          {error && <div className="form-message error">{error}</div>}
          <div className="buttons">
            {mode === 'view' && selectedItem?.id && (
              <button
                type="button"
                onClick={handleEditClick}
                disabled={isSaving}
              >
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
                Delete
              </button>
            )}
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

        {(formData?.createdAt || formData?.updatedAt) && mode !== 'add' && (
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

export default EventsForm;
