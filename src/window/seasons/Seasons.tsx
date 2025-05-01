// src/window/seasons/Seasons.tsx

import React, { useState, useMemo } from 'react';
import { useSeasons, SeasonWithTeamInfo } from './useSeasons';
import { useFilterContext } from '../../filter/FilterContext';
import { useFormContext } from '../../form/FormContext';

// Configuration Types for SeasonsWindow
type SeasonNameDisplayType = 'teamCodeSeasonYear' | 'teamNameSeasonYear';
type SeasonEndColumnDataType =
  | 'none'
  | 'startDate'
  | 'meetsCount'
  | 'athletesCount'
  | 'resultsCount';

function SeasonsWindow() {
  // State for UI Controls
  const [nameDisplay, setNameDisplay] =
    useState<SeasonNameDisplayType>('teamCodeSeasonYear');
  const [endColumnData, setEndColumnData] =
    useState<SeasonEndColumnDataType>('startDate');

  // Data Fetching
  const { data: seasons, isLoading, isError, error } = useSeasons();

  // Selection State from FilterContext
  const {
    state: filterState,
    toggleSelection,
    clearAllByType, // <<< Get the clear function
  } = useFilterContext();
  const selectedTeamIds = filterState.selected.team;
  const superSelectedTeamIds = filterState.superSelected.team;
  const selectedSeasonIds = filterState.selected.season;
  const superSelectedSeasonIds = filterState.superSelected.season;

  // Form State Action Dispatcher
  const { selectItemForForm } = useFormContext();

  // Derived State for Team Filtering Logic
  const hasAnyTeamSuperSelected = useMemo(
    () => superSelectedTeamIds.length > 0,
    [superSelectedTeamIds]
  );
  const hasAnyTeamSelected = useMemo(
    () => selectedTeamIds.length > 0,
    [selectedTeamIds]
  );

  // Derived State for Season Selection Highlighting / Button Disabling
  const isAnySeasonSelectionActive = useMemo(
    () => selectedSeasonIds.length > 0 || superSelectedSeasonIds.length > 0,
    [selectedSeasonIds, superSelectedSeasonIds]
  );

  // Sorting Logic for Seasons
  const sortedAndFilteredSeasons = useMemo(() => {
    // (Sorting/Filtering logic remains the same)
    if (!seasons) return [];
    const visuallyFilteredSeasons = seasons.filter((season) => {
      if (hasAnyTeamSuperSelected) {
        return superSelectedTeamIds.includes(season.team);
      }
      return true;
    });
    const seasonsToSort = [...visuallyFilteredSeasons];
    seasonsToSort.sort((a: SeasonWithTeamInfo, b: SeasonWithTeamInfo) => {
      let valA: string | number | null | undefined;
      let valB: string | number | null | undefined;
      switch (endColumnData) {
        case 'startDate':
          valA = a.startDate ?? '';
          valB = b.startDate ?? '';
          break;
        case 'meetsCount':
          valA = a.meetCount ?? 0;
          valB = b.meetCount ?? 0;
          break;
        case 'athletesCount':
          valA = a.athletesCount ?? 0;
          valB = b.athletesCount ?? 0;
          break;
        case 'resultsCount':
          valA = a.resultsCount ?? 0;
          valB = b.resultsCount ?? 0;
          break;
        case 'none':
        default:
          return (a.startDate ?? '').localeCompare(b.startDate ?? '');
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
        return (a.startDate ?? '').localeCompare(b.startDate ?? '');
      }
      return primarySortResult;
    });
    return seasonsToSort;
  }, [seasons, endColumnData, superSelectedTeamIds, hasAnyTeamSuperSelected]); // Removed selectedTeamIds dependency as it's only for fading now

  // Event Handlers
  const handleNameDisplayChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setNameDisplay(event.target.value as SeasonNameDisplayType);
  };

  const handleEndColumnChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setEndColumnData(event.target.value as SeasonEndColumnDataType);
  };

  const handleItemClick = (
    season: SeasonWithTeamInfo,
    isClickable: boolean
  ) => {
    if (!isClickable) return;
    toggleSelection('season', season.id);
    selectItemForForm('season', season.id, 'view');
  };

  const handleAddClick = () => {
    selectItemForForm('season', null, 'add');
  };

  // --- NEW: Handler for Clear button click ---
  const handleClearClick = () => {
    // Clear both selected and super-selected for the 'season' type
    clearAllByType('season');
    // Optional: Also clear the form if a season was selected for editing?
    // const { selectedItem, clearForm } = useFormContext(); // Need clearForm too
    // if (selectedItem?.type === 'season') {
    //   clearForm();
    // }
  };

  // Rendering Logic (renderSeasonName, renderEndColumn remain the same)
  const renderSeasonName = (season: SeasonWithTeamInfo): string => {
    /* ... */ const teamDisplay =
      nameDisplay === 'teamCodeSeasonYear'
        ? (season.teamCode ?? 'N/A')
        : (season.teamNameShort ?? 'N/A');
    return `${teamDisplay} ${season.season} ${season.year}`;
  };
  const renderEndColumn = (season: SeasonWithTeamInfo): string | number => {
    /* ... */ switch (endColumnData) {
      case 'startDate':
        return season.startDate ?? 'N/A';
      case 'meetsCount':
        return season.meetCount ?? 0;
      case 'athletesCount':
        return season.athletesCount ?? 0;
      case 'resultsCount':
        return season.resultsCount ?? 0;
      case 'none':
      default:
        return '';
    }
  };

  // Main Render
  return (
    <div className="window">
      {/* Header Row */}
      <div className="row">
        <p>Seasons ({sortedAndFilteredSeasons?.length ?? 0})</p>
        <div className="buttons">
          <button onClick={handleAddClick}>Add</button>
          {/* Add the Clear button */}
          <button
            onClick={handleClearClick}
            // Disable if no seasons are currently selected or super-selected
            disabled={!isAnySeasonSelectionActive}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Options Row (Dropdowns) */}
      <div className="options">
        {/* (Select elements remain the same) */}
        <select value={nameDisplay} onChange={handleNameDisplayChange}>
          <option value="teamCodeSeasonYear">Team Code + Season + Year</option>
          <option value="teamNameSeasonYear">Team Name + Season + Year</option>
        </select>
        <select value={endColumnData} onChange={handleEndColumnChange}>
          <option value="startDate">Start Date</option>
          <option value="meetsCount">Meets Count</option>
          <option value="athletesCount">Athletes Count</option>
          <option value="resultsCount">Results Count</option>
          <option value="none">-- None --</option>
        </select>
      </div>

      {/* Data List */}
      <div className="list">
        {/* (Loading, Error, List mapping remain the same) */}
        {isLoading && <div className="loading-message">Loading seasons...</div>}
        {isError && (
          <div className="error-message">
            Error loading seasons: {error?.message}
          </div>
        )}
        {!isLoading &&
          !isError &&
          sortedAndFilteredSeasons.map(
            (season: SeasonWithTeamInfo, index: number) => {
              let isFaded = false;
              let isClickable = true;
              if (
                hasAnyTeamSelected &&
                !hasAnyTeamSuperSelected &&
                !selectedTeamIds.includes(season.team)
              ) {
                isFaded = true;
                isClickable = false;
              }
              const isSeasonSelected = selectedSeasonIds.includes(season.id);
              const isSeasonSuperSelected = superSelectedSeasonIds.includes(
                season.id
              );
              let itemClasses: string[] = ['item'];
              if (isSeasonSuperSelected) {
                itemClasses.push('super', 'selected');
              } else if (isSeasonSelected) {
                itemClasses.push('selected');
              }
              if (isFaded && !isSeasonSelected && !isSeasonSuperSelected) {
                itemClasses.push('faded');
              }
              if (
                !isFaded &&
                isAnySeasonSelectionActive &&
                !isSeasonSelected &&
                !isSeasonSuperSelected
              ) {
                itemClasses.push('faded');
              }
              return (
                <div
                  key={season.id}
                  className={itemClasses.join(' ')}
                  onClick={() => handleItemClick(season, isClickable)}
                  role="button"
                  tabIndex={isClickable ? 0 : -1}
                  aria-disabled={!isClickable}
                  onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleItemClick(season, isClickable);
                    }
                  }}
                >
                  <p className="count">{index + 1}</p>
                  <p className="name">{renderSeasonName(season)}</p>
                  <p className="end">{renderEndColumn(season)}</p>
                </div>
              );
            }
          )}
        {!isLoading && !isError && sortedAndFilteredSeasons.length === 0 && (
          <div className="empty-message">
            No seasons found for the selected team filter.
          </div>
        )}
      </div>
    </div>
  );
}

export default SeasonsWindow;
