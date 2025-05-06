import React, { useState, useMemo } from 'react';
import {
  useAthletesForSeason,
  AthleteWithContextInfo,
} from './useAthletesForSeason'; // Adjust path
import { getAgeGenderString } from '../../utils/age'; // Adjust path
import '../../styles/window.css'; // Reuse some list item styles

interface AthleteSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: { athleteId: string; personId: string }) => void;
  teamId: string | null;
  seasonId: string | null;
  excludeIds?: string[]; // Athlete IDs to disable/hide (e.g., already selected in relay)
}

const AthleteSelectorModal: React.FC<AthleteSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  teamId,
  seasonId,
  excludeIds = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch athletes using the dedicated hook
  const {
    data: athletes, // AthleteWithContextInfo[] | undefined
    isLoading,
    isError,
    error,
  } = useAthletesForSeason(teamId, seasonId);

  // Memoize excluded IDs set for performance
  const excludedIdSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  // Filter athletes based on search term and exclusions
  const filteredAthletes = useMemo(() => {
    if (!athletes) return [];

    const lowerSearchTerm = searchTerm.toLowerCase().trim();

    return athletes.filter((athlete) => {
      // Check exclusion first
      if (excludedIdSet.has(athlete.id)) {
        return false;
      }

      // Check search term against names
      if (lowerSearchTerm) {
        const firstName = (athlete.personFirstName ?? '').toLowerCase();
        const lastName = (athlete.personLastName ?? '').toLowerCase();
        const preferredName = (athlete.personPreferredName ?? '').toLowerCase();
        return (
          firstName.includes(lowerSearchTerm) ||
          lastName.includes(lowerSearchTerm) ||
          preferredName.includes(lowerSearchTerm)
        );
      }

      // If no search term and not excluded, include the athlete
      return true;
    });
  }, [athletes, searchTerm, excludedIdSet]);

  // --- Event Handlers ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectClick = (athlete: AthleteWithContextInfo) => {
    // Ensure 'person' field (personId) exists on the athlete object
    if (!athlete.person) {
      console.error('Selected athlete missing person ID:', athlete);
      // Optionally show an error to the user
      return;
    }
    onSelect({ athleteId: athlete.id, personId: athlete.person });
  };

  // --- Render Logic ---

  // Don't render anything if the modal is not open
  if (!isOpen) {
    return null;
  }

  // Render Name Column Helper (similar to AthletesWindow)
  const renderNameColumn = (
    athlete: AthleteWithContextInfo
  ): React.ReactNode => {
    const firstName = athlete.personPreferredName || athlete.personFirstName;
    const lastName = athlete.personLastName;
    const baseName = `${firstName ?? ''} ${lastName ?? ''}`.trim();

    // Construct a temporary Person-like object for the helper
    const ageGenderSuffix = getAgeGenderString({
      birthday: athlete.personBirthday,
      gender: athlete.personGender,
    });

    const combinedName = ageGenderSuffix
      ? `${baseName} ${ageGenderSuffix}`.trim()
      : baseName;
    return <p className="name">{combinedName || 'Unnamed Athlete'}</p>;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {' '}
      {/* Close on overlay click */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {' '}
        {/* Prevent closing when clicking inside */}
        <div className="modal-header">
          <h2>Select Athlete</h2>
          <button onClick={onClose} className="modal-close-button">
            &times;
          </button>
        </div>
        <div className="modal-body">
          {/* Search Input */}
          <input
            className="search modal-search" // Add specific modal search class if needed
            type="text"
            placeholder="Search Name..."
            value={searchTerm}
            onChange={handleSearchChange}
            autoFocus
          />

          {/* Status Messages */}
          {!teamId ||
            (!seasonId && (
              <div className="modal-message info">
                Please select a Team and Season in the form first.
              </div>
            ))}
          {isLoading && (
            <div className="modal-message">Loading athletes...</div>
          )}
          {isError && (
            <div className="modal-message error">
              Error loading athletes: {error?.message}
            </div>
          )}
          {!isLoading &&
            !isError &&
            teamId &&
            seasonId &&
            filteredAthletes.length === 0 && (
              <div className="modal-message">
                {searchTerm
                  ? 'No athletes match your search.'
                  : 'No available athletes found for this Team/Season.'}
              </div>
            )}

          {/* Athlete List */}
          <div className="list modal-list">
            {' '}
            {/* Reuse list styles */}
            {!isLoading &&
              !isError &&
              teamId &&
              seasonId &&
              filteredAthletes.map((athlete, index) => (
                <div
                  key={athlete.id}
                  className="item modal-list-item" // Add specific modal item class if needed
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectClick(athlete)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectClick(athlete);
                    }
                  }}
                >
                  {/* Display Athlete Info */}
                  <p className="count">{index + 1}</p>
                  {renderNameColumn(athlete)}
                  {/* Optionally display grade/group if needed */}
                  {/* <p className="end">{athlete.grade ?? athlete.group ?? ''}</p> */}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteSelectorModal;
