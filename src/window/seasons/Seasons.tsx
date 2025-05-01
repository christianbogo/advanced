// src/window/seasons/Seasons.tsx

import React, { useState, useMemo } from 'react';
import { useSeasons, SeasonWithTeamInfo } from './useSeasons';
import { useFilterContext } from '../../filter/FilterContext';
import { useFormContext } from '../../form/FormContext';
import { dateDisplay } from '../../utils/display';
// Assuming window.css is loaded globally or imported elsewhere

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

  // Context Hooks
  const {
    state: filterState,
    toggleSelection,
    clearAllByType,
  } = useFilterContext();
  const { selectItemForForm } = useFormContext();

  // Selection State
  const selectedTeamIds = filterState.selected.team;
  const superSelectedTeamIds = filterState.superSelected.team;
  const selectedSeasonIds = filterState.selected.season;
  const superSelectedSeasonIds = filterState.superSelected.season;

  // Derived State
  const hasAnyTeamSuperSelected = useMemo(
    () => superSelectedTeamIds.length > 0,
    [superSelectedTeamIds]
  );
  const hasAnyTeamSelected = useMemo(
    () => selectedTeamIds.length > 0,
    [selectedTeamIds]
  );
  // Check if any season in *this* list is selected/super-selected (for disabling Clear button)
  const isAnySeasonSelectionActive = useMemo(
    () => selectedSeasonIds.length > 0 || superSelectedSeasonIds.length > 0,
    [selectedSeasonIds, superSelectedSeasonIds]
  );

  // Sorting and Filtering Logic (Filters based on super-select, sorts the rest)
  const sortedAndFilteredSeasons = useMemo(() => {
    if (!seasons) return [];
    // Filter based on team super-selection *before* sorting
    const visuallyFilteredSeasons = seasons.filter((season) => {
      // If any team is super-selected, ONLY include seasons matching those teams
      if (hasAnyTeamSuperSelected) {
        return superSelectedTeamIds.includes(season.team);
      }
      // Otherwise (no super-selection), include all seasons fetched by useSeasons
      return true;
    });

    // Sort the potentially filtered seasons
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
    // Dependencies now include filter criteria that affect the filtering step
  }, [seasons, endColumnData, superSelectedTeamIds, hasAnyTeamSuperSelected]);

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
  const handleClearClick = () => {
    clearAllByType('season');
  };

  // Rendering Logic for End Column
  const renderEndColumn = (season: SeasonWithTeamInfo): string | number => {
    switch (endColumnData) {
      case 'startDate':
        return dateDisplay(season.startDate) ?? 'N/A';
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
        {/* Count reflects items after super-select filtering */}
        <p>Seasons ({isLoading ? '...' : sortedAndFilteredSeasons.length})</p>
        <div className="buttons">
          <button onClick={handleAddClick}>Add</button>
          <button
            onClick={handleClearClick}
            disabled={!isAnySeasonSelectionActive}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Options Row */}
      <div className="options">
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
              // --- Refined Filtering and Styling Logic ---

              // 1. Determine Fading/Clickability based on *normal* team selection
              //    (Only applies if no teams are super-selected)
              let isFaded = false;
              let isClickable = true;
              if (
                hasAnyTeamSelected &&
                !hasAnyTeamSuperSelected &&
                !selectedTeamIds.includes(season.team)
              ) {
                isFaded = true;
                isClickable = false; // Cannot interact with faded items
              }

              // 2. Determine Selection Highlighting (based on season selection)
              const isSeasonSelected = selectedSeasonIds.includes(season.id);
              const isSeasonSuperSelected = superSelectedSeasonIds.includes(
                season.id
              );

              // 3. Build Classes
              let itemClasses: string[] = ['item'];
              if (isSeasonSuperSelected) {
                itemClasses.push('super', 'selected');
              } else if (isSeasonSelected) {
                itemClasses.push('selected');
              }

              // Apply fade *only* if determined by team selection (step 1)
              // AND only if the season itself isn't selected/super-selected
              if (isFaded && !isSeasonSelected && !isSeasonSuperSelected) {
                itemClasses.push('faded');
              }
              // REMOVED: Logic that faded based on *other* season selections

              // --- Rendering ---
              const teamCode = season.teamCode ?? 'N/A';
              const seasonDetails = `${season.season} ${season.year}`;
              const teamName = season.teamNameShort ?? 'N/A';

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
                  {/* Use index + 1 from the filtered/sorted map */}
                  <p className="count">{index + 1}</p>
                  {nameDisplay === 'teamCodeSeasonYear' ? (
                    <>
                      <p className="code">{teamCode}</p>
                      <p className="name">{seasonDetails}</p>
                    </>
                  ) : (
                    <p className="name">{`${teamName} ${seasonDetails}`}</p>
                  )}
                  <p className="end">{renderEndColumn(season)}</p>
                </div>
              );
            }
          )}

        {/* Empty State */}
        {!isLoading && !isError && sortedAndFilteredSeasons.length === 0 && (
          <div className="empty-message">
            No seasons found for the selected team filter.
          </div>
        )}
      </div>
    </div>
  );
}

export default SeasonsWindow; // Export the main component
