// src/window/seasons/SeasonsWindow.tsx

import React, { useState, useMemo } from 'react';
import { useSeasons, SeasonWithTeamInfo } from './useSeasons';
import { useFilterContext } from '../../filter/FilterContext';
import { useFormContext } from '../../form/FormContext';
import { dateDisplay } from '../../utils/display';

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
    toggleSelection, // Used for normal click/enter/space
    clearAllByType,
  } = useFilterContext();
  const { selectItemForForm } = useFormContext(); // Used for shift+click/enter/space

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
  const isAnySeasonSelectionActive = useMemo(
    () => selectedSeasonIds.length > 0 || superSelectedSeasonIds.length > 0,
    [selectedSeasonIds, superSelectedSeasonIds]
  );

  // Sorting and Filtering Logic (No change needed here)
  const sortedAndFilteredSeasons = useMemo(() => {
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
        return (b.startDate ?? '').localeCompare(a.startDate ?? ''); // Secondary sort by date desc
      }
      return primarySortResult;
    });
    return seasonsToSort;
  }, [seasons, endColumnData, superSelectedTeamIds, hasAnyTeamSuperSelected]);

  // --- Event Handlers ---
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

  // NEW: Handler for MouseDown to prevent default Shift behavior (like text selection)
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.shiftKey) {
      event.preventDefault();
    }
  };

  // MODIFIED: Handles click logic based on Shift key
  const handleItemClick = (
    season: SeasonWithTeamInfo,
    isClickable: boolean,
    event: React.MouseEvent<HTMLDivElement> // Accept event
  ) => {
    if (!isClickable) return;

    if (event.shiftKey) {
      // Shift+Click: Load into form ONLY
      selectItemForForm('season', season.id, 'view');
    } else {
      // Normal Click: Toggle selection ONLY
      toggleSelection('season', season.id);
    }
  };

  const handleAddClick = () => {
    selectItemForForm('season', null, 'add');
  };
  const handleClearClick = () => {
    clearAllByType('season');
  };

  // Rendering Logic for End Column (No change)
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
      {/* Header Row (No change) */}
      <div className="row">
        <p>Seasons ({isLoading ? '...' : sortedAndFilteredSeasons.length})</p>
        <div className="buttons">
          <button onClick={handleAddClick}>Add</button>
          <button
            onClick={handleClearClick}
            disabled={!isAnySeasonSelectionActive}
          >
            {' '}
            Clear{' '}
          </button>
        </div>
      </div>

      {/* Options Row (No change) */}
      <div className="options">
        <select value={nameDisplay} onChange={handleNameDisplayChange}>
          <option value="teamCodeSeasonYear">Code Season</option>
          <option value="teamNameSeasonYear">Name Season</option>
        </select>
        <select value={endColumnData} onChange={handleEndColumnChange}>
          <option value="startDate">Start Date</option>
          <option value="meetsCount">Meets</option>
          <option value="athletesCount">Athletes</option>
          <option value="resultsCount">Results</option>
        </select>
      </div>

      {/* Data List */}
      <div className="list">
        {isLoading && <div className="loading-message">Loading seasons...</div>}
        {isError && (
          <div className="error-message">
            {' '}
            Error loading seasons: {error?.message}{' '}
          </div>
        )}

        {!isLoading &&
          !isError &&
          sortedAndFilteredSeasons.map(
            (season: SeasonWithTeamInfo, index: number) => {
              // --- Determine Fading/Clickability (No change needed here) ---
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

              // --- Determine Selection Highlighting (No change needed here) ---
              const isSeasonSelected = selectedSeasonIds.includes(season.id);
              const isSeasonSuperSelected = superSelectedSeasonIds.includes(
                season.id
              );

              // --- Build Classes (No change needed here) ---
              let itemClasses: string[] = ['item'];
              if (isSeasonSuperSelected) {
                itemClasses.push('super', 'selected');
              } else if (isSeasonSelected) {
                itemClasses.push('selected');
              }
              if (isFaded && !isSeasonSelected && !isSeasonSuperSelected) {
                itemClasses.push('faded');
              }

              // --- Rendering ---
              const teamCode = season.teamCode ?? 'N/A';
              const seasonDetails = `${season.season} ${season.year}`;
              const teamName = season.teamNameShort ?? 'N/A';

              return (
                <div
                  key={season.id}
                  className={itemClasses.join(' ')}
                  // MODIFIED: Add onMouseDown, pass event to onClick
                  onMouseDown={handleMouseDown}
                  onClick={(e) => handleItemClick(season, isClickable, e)}
                  role="button"
                  tabIndex={isClickable ? 0 : -1}
                  aria-disabled={!isClickable}
                  // MODIFIED: Differentiate keyboard actions
                  onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (
                      isClickable &&
                      e.shiftKey &&
                      (e.key === 'Enter' || e.key === ' ')
                    ) {
                      // Shift + Enter/Space: Load to form
                      e.preventDefault();
                      selectItemForForm('season', season.id, 'view');
                    } else if (
                      isClickable &&
                      (e.key === 'Enter' || e.key === ' ')
                    ) {
                      // Enter/Space: Toggle selection
                      e.preventDefault();
                      toggleSelection('season', season.id);
                    }
                  }}
                >
                  <p className="count">{index + 1}</p>
                  {nameDisplay === 'teamCodeSeasonYear' ? (
                    <>
                      {' '}
                      <p className="code">{teamCode}</p>{' '}
                      <p className="name">{seasonDetails}</p>{' '}
                    </>
                  ) : (
                    <p className="name">{`${teamName} ${seasonDetails}`}</p>
                  )}
                  <p className="end">{renderEndColumn(season)}</p>
                </div>
              );
            }
          )}

        {/* Empty State (No change) */}
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
