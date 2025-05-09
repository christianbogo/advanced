// src/window/seasons/SeasonsWindow.tsx

import React, { useState, useMemo } from 'react';
import { useSeasons } from './useSeasons';
import { Season } from '../../types/data';
import { useFilterContext } from '../../filter/FilterContext';
import { useFormContext } from '../../form/FormContext';
import { dateDisplay } from '../../utils/date';

type SeasonNameDisplayType = 'teamCodeSeasonYear' | 'teamNameSeasonYear';
type SeasonEndColumnDataType =
  | 'none'
  | 'startDate'
  | 'meetsCount'
  | 'athletesCount'
  | 'resultsCount';

function SeasonsWindow() {
  const [nameDisplay, setNameDisplay] =
    useState<SeasonNameDisplayType>('teamCodeSeasonYear');
  const [endColumnData, setEndColumnData] =
    useState<SeasonEndColumnDataType>('startDate');

  const { data: seasons, isLoading, isError, error } = useSeasons();

  const {
    state: filterState,
    toggleSelection,
    clearAllByType,
  } = useFilterContext();
  const { selectItemForForm } = useFormContext();

  const selectedTeamIds = filterState.selected.team;
  const superSelectedTeamIds = filterState.superSelected.team;
  const selectedSeasonIds = filterState.selected.season;
  const superSelectedSeasonIds = filterState.superSelected.season;

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

  const sortedAndFilteredSeasons = useMemo(() => {
    if (!seasons) return [];

    const visuallyFilteredSeasons = seasons.filter((season: Season) => {
      if (hasAnyTeamSuperSelected) {
        return season.team && superSelectedTeamIds.includes(season.team.id);
      }
      return true;
    });

    const seasonsToSort = [...visuallyFilteredSeasons];
    seasonsToSort.sort((a: Season, b: Season) => {
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
          return (b.startDate ?? '').localeCompare(a.startDate ?? ''); // Default sort: newer start dates first
      }
      let primarySortResult = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        primarySortResult = valB - valA;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        primarySortResult = valB.localeCompare(valA); // Assumes string dates are comparable this way (YYYY-MM-DD)
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
        return (b.startDate ?? '').localeCompare(a.startDate ?? '');
      }
      return primarySortResult;
    });
    return seasonsToSort;
  }, [seasons, endColumnData, superSelectedTeamIds, hasAnyTeamSuperSelected]);

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

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.shiftKey) {
      event.preventDefault();
    }
  };

  const handleItemClick = (
    season: Season,
    isClickable: boolean,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!isClickable) return;

    if (event.shiftKey) {
      selectItemForForm('season', season.id, 'view');
    } else {
      toggleSelection('season', season.id);
    }
  };

  const handleAddClick = () => {
    selectItemForForm('season', null, 'add');
  };
  const handleClearClick = () => {
    clearAllByType('season');
  };

  const renderEndColumn = (season: Season): string | number => {
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

  return (
    <div className="window">
      <div className="row">
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

      <div className="list">
        {isLoading && <div className="loading-message">Loading seasons...</div>}
        {isError && error && (
          <div className="error-message">
            Error loading seasons: {error.message}
          </div>
        )}

        {!isLoading &&
          !isError &&
          sortedAndFilteredSeasons.map((season: Season, index: number) => {
            let isFaded = false;
            let isClickable = true;
            if (
              hasAnyTeamSelected &&
              !hasAnyTeamSuperSelected &&
              season.team && // Check if team object exists
              !selectedTeamIds.includes(season.team.id)
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

            const teamCode = season.team?.code ?? 'N/A'; // Access via season.team
            const teamName = season.team?.nameShort ?? 'N/A'; // Access via season.team
            const seasonDetails = `${season.quarter} ${season.year}`; // Use quarter

            return (
              <div
                key={season.id}
                className={itemClasses.join(' ')}
                onMouseDown={handleMouseDown}
                onClick={(e) => handleItemClick(season, isClickable, e)}
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
                    selectItemForForm('season', season.id, 'view');
                  } else if (
                    isClickable &&
                    (e.key === 'Enter' || e.key === ' ')
                  ) {
                    e.preventDefault();
                    toggleSelection('season', season.id);
                  }
                }}
              >
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
          })}

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
