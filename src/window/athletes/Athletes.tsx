// src/window/athletes/AthletesWindow.tsx

import React, { useState, useMemo } from 'react';
import { useAthletes } from './useAthletes'; // Use the refactored hook
import { Athlete } from '../../types/data'; // Use the base Athlete type
import { useFilterContext } from '../../filter/FilterContext';
import { useFormContext } from '../../form/FormContext';
import { getAgeGenderString } from '../../utils/age'; // Assuming path is correct
import '../../styles/window.css';

type AthleteNameDisplayType = 'firstNameLastName' | 'lastNameFirstName';
type AthleteEndColumnDataType =
  | 'grade'
  | 'group'
  | 'teamCode'
  | 'season'
  | 'none';

function AthletesWindow() {
  const [nameDisplay, setNameDisplay] =
    useState<AthleteNameDisplayType>('firstNameLastName');
  const [endColumnData, setEndColumnData] =
    useState<AthleteEndColumnDataType>('grade');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: athletes, isLoading, isError, error } = useAthletes(); // athletes is now Athlete[]

  const {
    state: filterState,
    toggleSelection,
    clearAllByType,
  } = useFilterContext();
  const { selectItemForForm } = useFormContext();

  const selectedAthleteIds = filterState.selected.athlete;
  const superSelectedAthleteIds = filterState.superSelected.athlete;
  const selectedSeasonIds = filterState.selected.season;
  const superSelectedSeasonIds = filterState.superSelected.season;
  const selectedTeamIds = filterState.selected.team;
  const superSelectedTeamIds = filterState.superSelected.team;

  const isAnyAthleteSelectionActive = useMemo(
    () => selectedAthleteIds.length > 0 || superSelectedAthleteIds.length > 0,
    [selectedAthleteIds, superSelectedAthleteIds]
  );
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

  const filteredAndSortedAthletes = useMemo(() => {
    if (!athletes) return [];

    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    const filteredAthletes = !lowerSearchTerm
      ? athletes
      : athletes.filter((athlete) => {
          const firstName = (athlete.person?.firstName ?? '').toLowerCase();
          const lastName = (athlete.person?.lastName ?? '').toLowerCase();
          const preferredName = (
            athlete.person?.preferredName ?? ''
          ).toLowerCase();
          return (
            firstName.includes(lowerSearchTerm) ||
            lastName.includes(lowerSearchTerm) ||
            preferredName.includes(lowerSearchTerm)
          );
        });

    const athletesToSort = [...filteredAthletes];

    athletesToSort.sort((a, b) => {
      let compareResult = 0;
      let valA: string | number | null | undefined;
      let valB: string | number | null | undefined;

      switch (endColumnData) {
        case 'grade':
          valA = a.grade;
          valB = b.grade;
          compareResult = String(valA ?? '').localeCompare(String(valB ?? ''));
          break;
        case 'group':
          valA = a.group;
          valB = b.group;
          compareResult = String(valA ?? '').localeCompare(String(valB ?? ''));
          break;
        case 'teamCode':
          valA = a.team?.code;
          valB = b.team?.code;
          compareResult = String(valA ?? '').localeCompare(String(valB ?? ''));
          break;
        case 'season':
          valA = `${a.season?.quarter ?? ''} ${a.season?.year ?? ''}`;
          valB = `${b.season?.quarter ?? ''} ${b.season?.year ?? ''}`;
          compareResult = valA.localeCompare(valB);
          break;
        case 'none':
        default:
          compareResult = 0;
          break;
      }

      if (compareResult === 0) {
        const lastNameCompare = (a.person?.lastName ?? '').localeCompare(
          b.person?.lastName ?? ''
        );
        if (lastNameCompare !== 0) return lastNameCompare;
        return (a.person?.firstName ?? '').localeCompare(
          b.person?.firstName ?? ''
        );
      }
      return compareResult;
    });

    return athletesToSort;
  }, [athletes, searchTerm, endColumnData]);

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
    athlete: Athlete,
    isClickable: boolean,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!isClickable) return;
    if (event.shiftKey) selectItemForForm('athlete', athlete.id, 'view');
    else toggleSelection('athlete', athlete.id);
  };
  const handleAddClick = () => selectItemForForm('athlete', null, 'add');
  const handleClearClick = () => clearAllByType('athlete');

  const renderEndColumn = (athlete: Athlete): string | number => {
    switch (endColumnData) {
      case 'grade':
        return athlete.grade ?? '-';
      case 'group':
        return athlete.group ?? '-';
      case 'teamCode':
        return athlete.team?.code ?? '-';
      case 'season':
        return `${athlete.season?.quarter ?? '?'} ${athlete.season?.year ?? '?'}`;
      case 'none':
      default:
        return '';
    }
  };

  const renderNameColumn = (athlete: Athlete): React.ReactNode => {
    const firstName =
      athlete.person?.preferredName || athlete.person?.firstName;
    const lastName = athlete.person?.lastName;
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

    const ageGenderSuffix = getAgeGenderString({
      birthday: athlete.person?.birthday,
      gender: athlete.person?.gender,
    });

    const combinedName = ageGenderSuffix
      ? `${baseName.trim()} ${ageGenderSuffix}`.trim()
      : baseName.trim();
    return <p className="name">{combinedName}</p>;
  };

  return (
    <div className="window">
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

      <div className="list">
        {isLoading && (
          <div className="loading-message">Loading athletes...</div>
        )}
        {isError && error && (
          <div className="error-message">
            Error loading athletes: {error.message}
          </div>
        )}

        {!isLoading &&
          !isError &&
          filteredAndSortedAthletes.length === 0 &&
          !searchTerm &&
          !hasAnySeasonSuperSelected &&
          !hasAnyTeamSuperSelected && (
            <div className="empty-message">
              Select a Team or Season to view athletes.
            </div>
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
            </div>
          )}

        {!isLoading &&
          !isError &&
          filteredAndSortedAthletes.map((athlete, index) => {
            let isFaded = false;
            let isClickable = true;
            if (hasAnySeasonSelected && !hasAnySeasonSuperSelected) {
              // Fade if season selected but this athlete's season doesn't match
              if (
                !athlete.season ||
                !selectedSeasonIds.includes(athlete.season.id)
              ) {
                isFaded = true;
                isClickable = false;
              }
            } else if (
              hasAnyTeamSelected &&
              !hasAnyTeamSuperSelected &&
              !hasAnySeasonSuperSelected
            ) {
              // Fade if team selected (and no season selected) but this athlete's team doesn't match
              if (!athlete.team || !selectedTeamIds.includes(athlete.team.id)) {
                isFaded = true;
                isClickable = false;
              }
            }

            const isSelected = selectedAthleteIds.includes(athlete.id);
            const isSuperSelected = superSelectedAthleteIds.includes(
              athlete.id
            );

            let itemClasses = ['item'];
            if (isSuperSelected) itemClasses.push('super', 'selected');
            else if (isSelected) itemClasses.push('selected');
            if (isFaded && !isSelected && !isSuperSelected)
              itemClasses.push('faded');

            return (
              <div
                key={athlete.id}
                className={itemClasses.join(' ')}
                onMouseDown={handleMouseDown}
                onClick={(e) => handleItemClick(athlete, isClickable, e)}
                role="button"
                tabIndex={isClickable ? 0 : -1}
                aria-disabled={!isClickable}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (!isClickable) return;
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
