import React, { useState, useMemo, useEffect } from 'react';
import { usePeople } from './usePersons';
import { Person } from '../../models/index';
import { getAgeGenderString } from '../../utils/age';
import '../../styles/form.css';

interface PersonSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (person: Person) => void;
  onAddNew: () => void;
}

function PersonSelectorModal({
  isOpen,
  onClose,
  onSelect,
  onAddNew,
}: PersonSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: people, isLoading, isError, error } = usePeople();

  const filteredPeople = useMemo(() => {
    if (!people) return [];
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowerSearchTerm) return people;

    return people.filter((person) => {
      const firstName = (person.firstName ?? '').toLowerCase();
      const lastName = (person.lastName ?? '').toLowerCase();
      const preferredName = (person.preferredName ?? '').toLowerCase();
      const primaryEmail = (person.emails?.[0] ?? '').toLowerCase();
      return (
        firstName.includes(lowerSearchTerm) ||
        lastName.includes(lowerSearchTerm) ||
        preferredName.includes(lowerSearchTerm) ||
        primaryEmail.includes(lowerSearchTerm)
      );
    });
  }, [people, searchTerm]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectPerson = (person: Person) => {
    onSelect(person); // Pass the full Person object
    onClose();
  };

  const handleAddNewPerson = () => {
    onAddNew();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const renderNameColumn = (person: Person): string => {
    const firstNameDisplay = person.preferredName || person.firstName;
    const lastNameDisplay = person.lastName;
    const baseName =
      `${firstNameDisplay ?? ''} ${lastNameDisplay ?? ''}`.trim();
    const ageGenderSuffix = getAgeGenderString(person);
    return ageGenderSuffix ? `${baseName} ${ageGenderSuffix}` : baseName;
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-selector-title"
    >
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="person-selector-title">Select Person</h2>
          <button
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="modal-search-container">
          <input
            type="text"
            placeholder="Search Name or Email..."
            className="modal-search-input"
            value={searchTerm}
            onChange={handleSearchChange}
            autoFocus
          />
        </div>
        <div className="modal-list-container">
          {isLoading && <div className="modal-message">Loading people...</div>}
          {isError && error && (
            <div className="modal-message error">
              Error loading people: {error.message}
            </div>
          )}
          {!isLoading && !isError && filteredPeople.length === 0 && (
            <div className="modal-message">
              {searchTerm
                ? 'No people found matching your search.'
                : 'No people found.'}
            </div>
          )}
          {!isLoading &&
            !isError &&
            filteredPeople.map((person) => (
              <div
                key={person.id}
                className="modal-list-item"
                onClick={() => handleSelectPerson(person)}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectPerson(person);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <span className="modal-item-name">
                  {renderNameColumn(person)}
                </span>
                <span className="modal-item-detail">
                  {person.emails?.[0] ?? ''}
                </span>
              </div>
            ))}
        </div>
        <div className="modal-footer">
          <button className="modal-button" onClick={handleAddNewPerson}>
            Add New Person
          </button>
          <button className="modal-button secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default PersonSelectorModal;
