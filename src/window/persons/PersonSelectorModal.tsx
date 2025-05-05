import React, { useState, useMemo, useEffect } from 'react';
import { usePeople } from './usePersons'; // Adjust path as needed
import { Person } from '../../models/index'; // Adjust path as needed
import { getAgeGenderString } from '../../utils/display'; // Adjust path as needed
import '../../styles/form.css'; // Make sure form.css is imported for modal styles

interface PersonSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Pass back the selected Person object (or minimal details)
  onSelect: (
    person: Pick<Person, 'id' | 'firstName' | 'lastName' | 'preferredName'>
  ) => void;
  onAddNew: () => void; // Function to trigger adding a new person
}

function PersonSelectorModal({
  isOpen,
  onClose,
  onSelect,
  onAddNew,
}: PersonSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all people using the existing hook
  const { data: people, isLoading, isError, error } = usePeople();

  // Filter people based on search term (client-side)
  const filteredPeople = useMemo(() => {
    if (!people) return [];
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowerSearchTerm) return people; // Return all if no search term

    return people.filter((person) => {
      const firstName = (person.firstName ?? '').toLowerCase();
      const lastName = (person.lastName ?? '').toLowerCase();
      const preferredName = (person.preferredName ?? '').toLowerCase();
      const primaryEmail = (person.emails?.[0] ?? '').toLowerCase(); // Search primary email too

      return (
        firstName.includes(lowerSearchTerm) ||
        lastName.includes(lowerSearchTerm) ||
        preferredName.includes(lowerSearchTerm) ||
        primaryEmail.includes(lowerSearchTerm)
      );
    });
    // Relies on the default sort (lastName, firstName) from usePeople
  }, [people, searchTerm]);

  // Reset search term when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectPerson = (person: Person) => {
    // Pass back only essential details needed by the calling form
    onSelect({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      preferredName: person.preferredName,
    });
    onClose(); // Close modal after selection
  };

  const handleAddNewPerson = () => {
    onAddNew(); // Call the provided function
    onClose(); // Close this modal
  };

  // Don't render the modal if it's not open
  if (!isOpen) {
    return null;
  }

  // Helper to render the name column for consistency
  const renderNameColumn = (person: Person): string => {
    const firstName = person.preferredName || person.firstName;
    const lastName = person.lastName;
    const baseName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
    const ageGenderSuffix = getAgeGenderString(person);
    return ageGenderSuffix ? `${baseName} ${ageGenderSuffix}` : baseName;
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose} // Close modal when clicking backdrop
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-selector-title"
    >
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {' '}
        {/* Prevent clicks inside modal from closing it */}
        {/* Modal Header */}
        <div className="modal-header">
          <h2 id="person-selector-title">Select Person</h2>
          <button
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            &times; {/* Unicode multiplication sign for 'X' */}
          </button>
        </div>
        {/* Search Input */}
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
        {/* List Area */}
        <div className="modal-list-container">
          {isLoading && <div className="modal-message">Loading people...</div>}
          {isError && (
            <div className="modal-message error">
              Error loading people: {error?.message}
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
                {/* Display name (adjust formatting as needed) */}
                <span className="modal-item-name">
                  {renderNameColumn(person)}
                </span>
                {/* Optionally display primary email or other info */}
                <span className="modal-item-detail">
                  {person.emails?.[0] ?? ''}
                </span>
              </div>
            ))}
        </div>
        {/* Footer Actions */}
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
