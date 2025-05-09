import React from 'react';
import { useFormContext, FormMode } from '../../form/FormContext';
import { Team } from '../../models/index';
import { formatTimestamp } from '../../utils/form';
import '../../styles/form.css'; // Ensure CSS path is correct

interface TeamsFormProps {
  formData: Partial<Team> | null;
  mode: FormMode;
}

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
    'Other',
  ];

  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        <section>
          <p className="form-section-title">Identification</p>
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
          <div className="field">
            <label htmlFor="type">Team Type</label>
            <select
              id="type"
              name="type"
              value={formData?.type ?? ''}
              onChange={handleChange}
              disabled={isDisabled}
              required
              aria-required="true"
            >
              <option value="" disabled>
                Select a type
              </option>
              {teamTypes.map((typeOption) => (
                <option key={typeOption} value={typeOption}>
                  {typeOption}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <p className="form-section-title">Location</p>
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

export default TeamsForm;
