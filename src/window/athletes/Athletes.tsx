// src/window/athletes/AthletesWindow.tsx

import React, { useState, useMemo } from 'react';
import { useAthletes, AthleteWithContextInfo } from './useAthletes'; // Adjust path
import { useFilterContext } from '../../filter/FilterContext'; // Adjust path
import { useFormContext } from '../../form/FormContext'; // Adjust path
import { getAgeGenderString } from '../../utils/age'; // Adjust path (assuming helper moved)
import '../../styles/window.css'; // Adjust path

// Config Types for AthleteWindow display options
type AthleteNameDisplayType = 'firstNameLastName' | 'lastNameFirstName';
// Available fields on AthleteWithContextInfo for the end column (excluding name/id/person fields)
type AthleteEndColumnDataType =
  | 'grade'
  | 'group'
  | 'teamCode'
  | 'season'
  | 'none';

function AthletesWindow() {
  // State for UI Controls
  const [nameDisplay, setNameDisplay] =
    useState<AthleteNameDisplayType>('firstNameLastName');
  const [endColumnData, setEndColumnData] =
    useState<AthleteEndColumnDataType>('grade'); // Default end column
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Data Fetching Hook
  const { data: athletes, isLoading, isError, error } = useAthletes(); // athletes is AthleteWithContextInfo[]

  // Context Hooks
  const {
    state: filterState,
    toggleSelection,
    clearAllByType,
  } = useFilterContext();
  const { selectItemForForm } = useFormContext();

  // Selection State from FilterContext (including parent levels)
  const selectedAthleteIds = filterState.selected.athlete;
  const superSelectedAthleteIds = filterState.superSelected.athlete;
  const selectedSeasonIds = filterState.selected.season;
  const superSelectedSeasonIds = filterState.superSelected.season;
  const selectedTeamIds = filterState.selected.team;
  const superSelectedTeamIds = filterState.superSelected.team;

  // Derived State for UI logic
  const isAnyAthleteSelectionActive = useMemo(
    () => selectedAthleteIds.length > 0 || superSelectedAthleteIds.length > 0,
    [selectedAthleteIds, superSelectedAthleteIds]
  );
  // Parent selection states for fading logic
  const hasAnySeasonSelected = useMemo(
    () => selectedSeasonIds.length > 0,
    [selectedSeasonIds]
  );
  const hasAnySeasonSuperSelected = useMemo(
    () => superSelectedSeasonIds.length > 0,
    [superSelectedSeasonIds]
  );
  const hasAnyTeamSelected = useMemo(
    () => selectedTeamIds.length > 0,
    [selectedTeamIds]
  );
  const hasAnyTeamSuperSelected = useMemo(
    () => superSelectedTeamIds.length > 0,
    [superSelectedTeamIds]
  );

  // Filtering and Sorting Logic (Client-Side)
  const filteredAndSortedAthletes = useMemo(() => {
    if (!athletes) return [];

    // 1. Filter by Search Term
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    const filteredAthletes = !lowerSearchTerm
      ? athletes
      : athletes.filter((athlete) => {
          // Search name fields
          const firstName = (athlete.personFirstName ?? '').toLowerCase();
          const lastName = (athlete.personLastName ?? '').toLowerCase();
          const preferredName = (
            athlete.personPreferredName ?? ''
          ).toLowerCase();
          // Optional: add other fields like teamCode?
          // const teamCode = (athlete.teamCode ?? '').toLowerCase();
          return (
            firstName.includes(lowerSearchTerm) ||
            lastName.includes(lowerSearchTerm) ||
            preferredName.includes(lowerSearchTerm)
            // || teamCode.includes(lowerSearchTerm)
          );
        });

    // 2. Sort the Filtered Results
    const athletesToSort = [...filteredAthletes];

    athletesToSort.sort((a, b) => {
      let compareResult = 0;
      let valA: string | number | null | undefined;
      let valB: string | number | null | undefined;

      // Primary sort based on selected end column
      switch (endColumnData) {
        case 'grade': // Assuming grade is string, adjust if number
          valA = a.grade;
          valB = b.grade;
          compareResult = String(valA ?? '').localeCompare(String(valB ?? ''));
          break;
        case 'group': // Assuming group is string
          valA = a.group;
          valB = b.group;
          compareResult = String(valA ?? '').localeCompare(String(valB ?? ''));
          break;
        case 'teamCode':
          valA = a.teamCode;
          valB = b.teamCode;
          compareResult = String(valA ?? '').localeCompare(String(valB ?? ''));
          break;
        case 'season':
          // Combine season name and year for sorting
          valA = `${a.seasonName ?? ''} ${a.seasonYear ?? ''}`;
          valB = `${b.seasonName ?? ''} ${b.seasonYear ?? ''}`;
          compareResult = valA.localeCompare(valB);
          break;
        case 'none':
        default:
          compareResult = 0; // No primary sort column selected
          break;
      }

      // Secondary sort by Person's Last Name, then First Name
      if (compareResult === 0) {
        const lastNameCompare = (a.personLastName ?? '').localeCompare(
          b.personLastName ?? ''
        );
        if (lastNameCompare !== 0) return lastNameCompare;
        return (a.personFirstName ?? '').localeCompare(b.personFirstName ?? '');
      }
      return compareResult;
    });

    return athletesToSort;
  }, [athletes, searchTerm, endColumnData]); // Dependencies

  // --- Event Handlers ---
  const toggleSearch = () => setIsSearchVisible((prev) => !prev);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);
  const handleNameDisplayChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setNameDisplay(e.target.value as AthleteNameDisplayType);
  const handleEndColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setEndColumnData(e.target.value as AthleteEndColumnDataType);
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.shiftKey) event.preventDefault();
  };
  const handleItemClick = (
    athlete: AthleteWithContextInfo,
    isClickable: boolean,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!isClickable) return; // Respect fading logic
    if (event.shiftKey) selectItemForForm('athlete', athlete.id, 'view');
    else toggleSelection('athlete', athlete.id);
  };
  const handleAddClick = () => selectItemForForm('athlete', null, 'add');
  const handleClearClick = () => clearAllByType('athlete');

  // --- Rendering Logic Helpers ---

  const renderEndColumn = (
    athlete: AthleteWithContextInfo
  ): string | number => {
    switch (endColumnData) {
      case 'grade':
        return athlete.grade ?? '-';
      case 'group':
        return athlete.group ?? '-';
      case 'teamCode':
        return athlete.teamCode ?? '-';
      case 'season':
        return `${athlete.seasonName ?? '?'} ${athlete.seasonYear ?? '?'}`;
      case 'none':
      default:
        return '';
    }
  };

  // Reuse getAgeGenderString by passing the relevant parts from AthleteWithContextInfo
  const renderNameColumn = (
    athlete: AthleteWithContextInfo
  ): React.ReactNode => {
    const firstName = athlete.personPreferredName || athlete.personFirstName;
    const lastName = athlete.personLastName;
    let baseName: string;

    switch (nameDisplay) {
      case 'lastNameFirstName':
        baseName = `${lastName ?? ''}, ${firstName ?? ''}`;
        break;
      case 'firstNameLastName':
      default:
        baseName = `${firstName ?? ''} ${lastName ?? ''}`;
        break;
    }

    // Construct a temporary Person-like object for the helper
    const ageGenderSuffix = getAgeGenderString({
      birthday: athlete.personBirthday,
      gender: athlete.personGender,
    });

    const combinedName = ageGenderSuffix
      ? `${baseName} ${ageGenderSuffix}`.trim()
      : baseName;
    return <p className="name">{combinedName}</p>;
  };

  // --- Main Render ---
  return (
    <div className="window">
      {/* Header */}
      <div className="row">
        <p>Athletes ({isLoading ? '...' : filteredAndSortedAthletes.length})</p>
        <div className="buttons">
          <button onClick={handleAddClick}>Add</button>
          <button onClick={toggleSearch}>
            {isSearchVisible ? 'Close' : 'Search'}
          </button>
          <button
            onClick={handleClearClick}
            disabled={!isAnyAthleteSelectionActive}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search Input */}
      {isSearchVisible && (
        <input
          className="search"
          type="text"
          placeholder="Search Name..."
          value={searchTerm}
          onChange={handleSearchChange}
          autoFocus
        />
      )}

      {/* Options */}
      <div className="options">
        <select value={nameDisplay} onChange={handleNameDisplayChange}>
          <option value="firstNameLastName">First Last</option>
          <option value="lastNameFirstName">Last, First</option>
        </select>
        <select value={endColumnData} onChange={handleEndColumnChange}>
          <option value="grade">Grade</option>
          <option value="group">Group</option>
          <option value="teamCode">Team</option>
          <option value="season">Season</option>
          <option value="none">None</option>
        </select>
      </div>

      {/* Data List */}
      <div className="list">
        {isLoading && (
          <div className="loading-message">Loading athletes...</div>
        )}
        {isError && (
          <div className="error-message">
            Error loading athletes: {error?.message}
          </div>
        )}
        {!isLoading &&
          !isError &&
          filteredAndSortedAthletes.length === 0 &&
          !searchTerm &&
          !hasAnySeasonSuperSelected &&
          !hasAnyTeamSuperSelected && (
            <div className="empty-message">Select a Team or Season.</div> // Initial empty state
          )}
        {!isLoading &&
          !isError &&
          filteredAndSortedAthletes.length === 0 &&
          (searchTerm ||
            hasAnySeasonSuperSelected ||
            hasAnyTeamSuperSelected) && (
            <div className="empty-message">
              {searchTerm
                ? 'No athletes found matching your search.'
                : 'No athletes found for the selected Team/Season.'}
            </div> // Empty state when filtered
          )}

        {!isLoading &&
          !isError &&
          filteredAndSortedAthletes.map((athlete, index) => {
            // Determine Fading/Clickability based on parent selections
            let isFaded = false;
            let isClickable = true;
            // Prioritize Season selection for fading
            if (hasAnySeasonSelected && !hasAnySeasonSuperSelected) {
              if (!selectedSeasonIds.includes(athlete.season)) {
                isFaded = true;
                isClickable = false;
              }
            }
            // If not faded by Season, check Team selection (only if no Seasons are super-selected)
            else if (
              hasAnyTeamSelected &&
              !hasAnyTeamSuperSelected &&
              !hasAnySeasonSuperSelected
            ) {
              if (!selectedTeamIds.includes(athlete.team)) {
                isFaded = true;
                isClickable = false;
              }
            }

            // Determine Selection Highlighting
            const isSelected = selectedAthleteIds.includes(athlete.id);
            const isSuperSelected = superSelectedAthleteIds.includes(
              athlete.id
            );

            // Build Classes
            let itemClasses = ['item'];
            if (isSuperSelected) itemClasses.push('super', 'selected');
            else if (isSelected) itemClasses.push('selected');
            // Apply 'faded' only if not selected/super-selected
            if (isFaded && !isSelected && !isSuperSelected)
              itemClasses.push('faded');

            return (
              <div
                key={athlete.id}
                className={itemClasses.join(' ')}
                onMouseDown={handleMouseDown}
                onClick={(e) => handleItemClick(athlete, isClickable, e)}
                role="button"
                tabIndex={isClickable ? 0 : -1} // Make non-clickable items unfocusable
                aria-disabled={!isClickable}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (!isClickable) return; // Ignore keyboard events if not clickable
                  if (e.shiftKey && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    selectItemForForm('athlete', athlete.id, 'view');
                  } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSelection('athlete', athlete.id);
                  }
                }}
              >
                <p className="count">{index + 1}</p>
                {renderNameColumn(athlete)}
                <p className="end">{renderEndColumn(athlete)}</p>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default AthletesWindow;
