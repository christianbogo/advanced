// src/window/meets/MeetsWindow.tsx

import React, { useState, useMemo } from 'react';
import { useMeets } from './useMeets';
import { Meet } from '../../types/data';
import { useFilterContext } from '../../filter/FilterContext';
import { useFormContext } from '../../form/FormContext';
import { dateDisplay } from '../../utils/date';

type MeetNameDisplayType =
  | 'teamCodeShortName'
  | 'longNameSeasonYear'
  | 'teamCodeLongName';
type MeetEndColumnDataType =
  | 'date'
  | 'eventsCount'
  | 'athletesCount'
  | 'resultsCount';

function MeetsWindow() {
  const [nameDisplay, setNameDisplay] =
    useState<MeetNameDisplayType>('teamCodeShortName');
  const [endColumnData, setEndColumnData] =
    useState<MeetEndColumnDataType>('date');

  const { data: meetsDataFromHook, isLoading, isError, error } = useMeets();

  const {
    state: filterState,
    toggleSelection,
    clearAllByType,
  } = useFilterContext();
  const { selectItemForForm } = useFormContext();

  const { selected: selectedIds, superSelected: superSelectedIds } =
    filterState;

  const selectedTeamIds = selectedIds.team;
  const superSelectedTeamIds = superSelectedIds.team;
  const selectedSeasonIds = selectedIds.season;
  const superSelectedSeasonIds = superSelectedIds.season;
  const selectedMeetIds = selectedIds.meet;
  const superSelectedMeetIds = superSelectedIds.meet;

  const hasSelectedTeams = selectedTeamIds.length > 0;
  const hasSuperSelectedTeams = superSelectedTeamIds.length > 0;
  const hasSelectedSeasons = selectedSeasonIds.length > 0;
  const hasSuperSelectedSeasons = superSelectedSeasonIds.length > 0;
  const hasSelectedMeets = selectedMeetIds.length > 0;
  const hasSuperSelectedMeets = superSelectedMeetIds.length > 0;

  const isAnyMeetSelectionForClearButtonActive =
    hasSelectedMeets || hasSuperSelectedMeets;

  const sortedMeets = useMemo(() => {
    if (!meetsDataFromHook) return [];
    const meetsToSort: Meet[] = [...meetsDataFromHook];
    meetsToSort.sort((a: Meet, b: Meet) => {
      let valA: string | number | null | undefined;
      let valB: string | number | null | undefined;
      switch (endColumnData) {
        case 'date':
          valA = a.date ?? '';
          valB = b.date ?? '';
          break;
        case 'eventsCount':
          valA = a.eventsCount ?? 0;
          valB = b.eventsCount ?? 0;
          break;
        case 'athletesCount':
          valA = a.athletesCount ?? 0;
          valB = b.athletesCount ?? 0;
          break;
        case 'resultsCount':
          valA = a.resultsCount ?? 0;
          valB = b.resultsCount ?? 0;
          break;
        default:
          valA = a.date ?? '';
          valB = b.date ?? '';
          break;
      }
      let primarySortResult = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        primarySortResult = valB - valA;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        primarySortResult = valB.localeCompare(valA);
      } else {
        if (valA == null && valB != null) primarySortResult = 1;
        else if (valA != null && valB == null) primarySortResult = -1;
        else if (typeof valA === 'number' && typeof valB !== 'number')
          primarySortResult = -1;
        else if (typeof valA !== 'number' && typeof valB === 'number')
          primarySortResult = 1;
        else primarySortResult = String(valB).localeCompare(String(valA));
      }
      if (primarySortResult === 0) {
        return (b.date ?? '').localeCompare(a.date ?? '');
      }
      return primarySortResult;
    });
    return meetsToSort;
  }, [meetsDataFromHook, endColumnData]);

  const meetsToDisplay = useMemo(() => {
    if (hasSuperSelectedMeets) {
      return sortedMeets.filter((meet) =>
        superSelectedMeetIds.includes(meet.id)
      );
    }
    return sortedMeets;
  }, [sortedMeets, superSelectedMeetIds, hasSuperSelectedMeets]);

  const handleNameDisplayChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setNameDisplay(event.target.value as MeetNameDisplayType);
  };

  const handleEndColumnChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setEndColumnData(event.target.value as MeetEndColumnDataType);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.shiftKey) {
      event.preventDefault();
    }
  };

  const handleItemClick = (
    meet: Meet,
    isClickable: boolean,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!isClickable) return;

    if (event.shiftKey) {
      selectItemForForm('meet', meet.id, 'view');
    } else {
      toggleSelection('meet', meet.id);
    }
  };

  const handleAddClick = () => {
    selectItemForForm('meet', null, 'add');
  };

  const handleClearClick = () => {
    clearAllByType('meet');
  };

  const renderEndColumn = (meet: Meet): string | number => {
    switch (endColumnData) {
      case 'date':
        return dateDisplay(meet.date) ?? 'N/A';
      case 'eventsCount':
        return meet.eventsCount ?? 0;
      case 'athletesCount':
        return meet.athletesCount ?? 0;
      case 'resultsCount':
        return meet.resultsCount ?? 0;
      default:
        return '';
    }
  };

  const renderNameColumn = (meet: Meet): React.ReactNode => {
    const teamCode = meet.season?.team?.code ?? 'N/A';
    const meetShortName = meet.nameShort ?? 'Unnamed Meet';
    const meetLongName = meet.nameLong ?? 'Unnamed Meet';
    const seasonQuarter = meet.season?.quarter ?? '';
    const seasonYear = meet.season?.year ?? '';
    const seasonDetails = `${seasonQuarter} ${seasonYear}`.trim();

    switch (nameDisplay) {
      case 'teamCodeShortName':
        return (
          <>
            <p className="code">{teamCode}</p>
            <p className="name">{meetShortName}</p>
          </>
        );
      case 'longNameSeasonYear':
        return (
          <p className="name">
            {`${meetLongName} (${seasonDetails || 'No Season Info'})`}
          </p>
        );
      case 'teamCodeLongName':
        return (
          <>
            <p className="code">{teamCode}</p>
            <p className="name">{meetLongName}</p>
          </>
        );
      default:
        return <p className="name">{meetShortName}</p>;
    }
  };

  return (
    <div className="window">
      <div className="row">
        <p>Meets ({isLoading ? '...' : meetsToDisplay.length})</p>
        <div className="buttons">
          <button onClick={handleAddClick}>Add</button>
          <button
            onClick={handleClearClick}
            disabled={!isAnyMeetSelectionForClearButtonActive}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="options">
        <select value={nameDisplay} onChange={handleNameDisplayChange}>
          <option value="teamCodeShortName">TeamCode ShortName</option>
          <option value="longNameSeasonYear">LongName Season</option>
          <option value="teamCodeLongName">TeamCode LongName</option>
        </select>
        <select value={endColumnData} onChange={handleEndColumnChange}>
          <option value="date">Date</option>
          <option value="eventsCount">Events</option>
          <option value="athletesCount">Athletes</option>
          <option value="resultsCount">Results</option>
        </select>
      </div>

      <div className="list">
        {isLoading && <div className="loading-message">Loading meets...</div>}
        {isError && error && (
          <div className="error-message">
            Error loading meets: {error.message}
          </div>
        )}

        {!isLoading &&
          !isError &&
          meetsToDisplay.map((meet: Meet, index: number) => {
            const isCurrentMeetSuperSelected = superSelectedMeetIds.includes(
              meet.id
            );
            const isCurrentMeetSelected = selectedMeetIds.includes(meet.id);

            let itemClasses = ['item'];
            let isFaded = false;
            let isClickable = true;

            if (isCurrentMeetSuperSelected) {
              itemClasses.push('super', 'selected');
            } else if (isCurrentMeetSelected) {
              itemClasses.push('selected');
            } else {
              // Not selected or super-selected itself.
              // Apply fading rules based on other selections.
              if (hasSuperSelectedMeets) {
                // This case should ideally not be reached if the meet is not super-selected,
                // due to the `meetsToDisplay` filter. Included for logical completeness / safety.
                // If somehow a non-super-selected meet is here when `hasSuperSelectedMeets` is true,
                // it implies it shouldn't be shown or interacted with.
                isFaded = true; // Should have been filtered out by meetsToDisplay
                isClickable = false;
              } else if (hasSelectedMeets) {
                // Rule: "If one or more meet is selected, fade any meet not selected."
                isFaded = true;
                isClickable = false;
              } else {
                // No meet selections (super or regular). Check team/season selections for fading.
                // Rule: "If no team or season is selected, all Meets should not be faded." (isFaded remains false by default)
                const applySeasonSelectionFading =
                  hasSelectedSeasons && !hasSuperSelectedSeasons;
                const applyTeamSelectionFading =
                  hasSelectedTeams &&
                  !hasSuperSelectedTeams &&
                  !hasSelectedSeasons && // Only if no season selection is active
                  !hasSuperSelectedSeasons;

                if (applySeasonSelectionFading) {
                  if (
                    !meet.season ||
                    !selectedSeasonIds.includes(meet.season.id)
                  ) {
                    isFaded = true;
                    isClickable = false;
                  }
                } else if (applyTeamSelectionFading) {
                  if (
                    !meet.season?.team ||
                    !selectedTeamIds.includes(meet.season.team.id)
                  ) {
                    isFaded = true;
                    isClickable = false;
                  }
                }
              }
            }

            if (isFaded) {
              itemClasses.push('faded');
            }

            return (
              <div
                key={meet.id}
                className={itemClasses.join(' ')}
                onMouseDown={handleMouseDown}
                onClick={(e) => handleItemClick(meet, isClickable, e)}
                role="button"
                tabIndex={isClickable ? 0 : -1}
                aria-disabled={!isClickable}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (
                    isClickable &&
                    e.shiftKey &&
                    (e.key === 'Enter' || e.key === ' ')
                  ) {
                    e.preventDefault();
                    selectItemForForm('meet', meet.id, 'view');
                  } else if (
                    isClickable &&
                    (e.key === 'Enter' || e.key === ' ')
                  ) {
                    e.preventDefault();
                    toggleSelection('meet', meet.id);
                  }
                }}
              >
                <p className="count">{index + 1}</p>
                {renderNameColumn(meet)}
                <p className="end">{renderEndColumn(meet)}</p>
              </div>
            );
          })}

        {!isLoading && !isError && meetsToDisplay.length === 0 && (
          <div className="empty-message">
            No meets found for the current filter.
            {(hasSuperSelectedSeasons ||
              hasSuperSelectedTeams ||
              hasSuperSelectedMeets) &&
              ' (Super-selection active)'}
          </div>
        )}
      </div>
    </div>
  );
}

export default MeetsWindow;
