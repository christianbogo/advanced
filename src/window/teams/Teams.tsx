// src/window/teams/Teams.tsx

import React, { useState, useMemo } from 'react';
import { useTeams } from './useTeams';
import { useFilterContext } from '../../filter/FilterContext';
import { useFormContext } from '../../form/FormContext';
import { Team } from '../../models/index';
// Assuming window.css is loaded globally or imported elsewhere

// Configuration Types (Simplified)
type NameDisplayType = 'codeOnly' | 'codeShort' | 'codeLong';
// Removed 'athletesCount' and 'latestSeasonYear'
type EndColumnDataType =
  | 'none'
  | 'seasonsCount'
  | 'meetsCount'
  | 'resultsCount';

function TeamsWindow() {
  // State for UI Controls
  const [nameDisplay, setNameDisplay] = useState<NameDisplayType>('codeShort');
  // Default remains 'seasonsCount'
  const [endColumnData, setEndColumnData] =
    useState<EndColumnDataType>('seasonsCount');

  // Data Fetching
  const { data: teams, isLoading, isError, error } = useTeams();

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

  // Derived State
  const hasAnyTeamSelected = useMemo(
    () => selectedTeamIds.length > 0,
    [selectedTeamIds]
  );
  const hasAnyTeamSuperSelected = useMemo(
    () => superSelectedTeamIds.length > 0,
    [superSelectedTeamIds]
  );
  const isAnySelectionActive = useMemo(
    () => hasAnyTeamSelected || hasAnyTeamSuperSelected,
    [hasAnyTeamSelected, hasAnyTeamSuperSelected]
  );

  // Sorting Logic (Simplified)
  const sortedTeams = useMemo(() => {
    if (!teams) return [];
    const teamsToSort = [...teams];
    teamsToSort.sort((a: Team, b: Team) => {
      let valA: string | number | null | undefined;
      let valB: string | number | null | undefined;
      switch (endColumnData) {
        case 'seasonsCount':
          valA = a.seasonCount ?? 0;
          valB = b.seasonCount ?? 0;
          break;
        case 'meetsCount':
          valA = a.meetCount ?? 0;
          valB = b.meetCount ?? 0;
          break;
        case 'resultsCount':
          valA = a.resultsCount ?? 0;
          valB = b.resultsCount ?? 0;
          break;
        // Removed cases for 'athletesCount' and 'latestSeasonYear'
        case 'none':
        default:
          return a.code.localeCompare(b.code); // Sort by code if 'none' or unknown
      }
      // Primary sort (descending)
      let primarySortResult = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        primarySortResult = valB - valA;
      } else {
        // Fallback for non-numeric or mixed types (shouldn't happen with counts)
        if (valA == null && valB != null) primarySortResult = 1;
        else if (valA != null && valB == null) primarySortResult = -1;
        else primarySortResult = String(valB).localeCompare(String(valA));
      }
      // Secondary sort (ascending code)
      if (primarySortResult === 0) {
        return a.code.localeCompare(b.code);
      }
      return primarySortResult;
    });
    return teamsToSort;
  }, [teams, endColumnData]);

  // Event Handlers
  const handleNameDisplayChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setNameDisplay(event.target.value as NameDisplayType);
  };
  const handleEndColumnChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setEndColumnData(event.target.value as EndColumnDataType);
  };
  const handleItemClick = (teamId: string) => {
    toggleSelection('team', teamId);
    selectItemForForm('team', teamId, 'view');
  };
  const handleAddClick = () => {
    selectItemForForm('team', null, 'add');
  };
  const handleClearClick = () => {
    clearAllByType('team');
  };

  // Rendering Logic
  const renderTeamName = (team: Team): string => {
    switch (nameDisplay) {
      case 'codeOnly':
        return '';
      case 'codeLong':
        return team.nameLong;
      case 'codeShort':
      default:
        return team.nameShort;
    }
  };

  const renderEndColumn = (team: Team): string | number => {
    switch (endColumnData) {
      case 'seasonsCount':
        return team.seasonCount ?? 0;
      case 'meetsCount':
        return team.meetCount ?? 0;
      case 'resultsCount':
        return team.resultsCount ?? 0;
      // Removed cases for 'athletesCount' and 'latestSeasonYear'
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
        <p>Teams ({sortedTeams?.length ?? 0})</p>
        <div className="buttons">
          <button onClick={handleAddClick}>Add</button>
          <button onClick={handleClearClick} disabled={!isAnySelectionActive}>
            Clear
          </button>
        </div>
      </div>

      {/* Options Row (Dropdowns - Simplified) */}
      <div className="options">
        <select value={nameDisplay} onChange={handleNameDisplayChange}>
          <option value="codeShort">Short Name</option>
          <option value="codeLong">Long Name</option>
          <option value="codeOnly">Code Only</option>
        </select>
        {/* Updated select options */}
        <select value={endColumnData} onChange={handleEndColumnChange}>
          <option value="seasonsCount">Seasons</option>
          <option value="meetsCount">Meets</option>
          {/* <option value="athletesCount">Athletes</option> Removed */}
          <option value="resultsCount">Results</option>
          {/* <option value="latestSeasonYear">Current Year</option> Removed */}
          <option value="none">-- None --</option>
        </select>
      </div>

      {/* Data List */}
      <div className="list">
        {/* (Loading, Error, List mapping remain the same) */}
        {isLoading && <div className="loading-message">Loading teams...</div>}
        {isError && (
          <div className="error-message">
            Error loading teams: {error?.message}
          </div>
        )}
        {!isLoading &&
          !isError &&
          sortedTeams.map((team: Team, index: number) => {
            const isSelected: boolean = selectedTeamIds.includes(team.id);
            const isSuperSelected: boolean = superSelectedTeamIds.includes(
              team.id
            );
            let itemClasses: string[] = ['item'];
            if (isSuperSelected) {
              itemClasses.push('super', 'selected');
            } else if (isSelected) {
              itemClasses.push('selected');
            } else if (isAnySelectionActive) {
              itemClasses.push('faded');
            }
            return (
              <div
                key={team.id}
                className={itemClasses.join(' ')}
                onClick={() => handleItemClick(team.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(team.id);
                  }
                }}
              >
                <p className="count">{index + 1}</p>
                <p className="code">{team.code}</p>
                <p className="name">{renderTeamName(team)}</p>
                <p className="end">{renderEndColumn(team)}</p>
              </div>
            );
          })}
        {!isLoading && !isError && sortedTeams.length === 0 && (
          <div className="empty-message">
            No teams found. Add a team to get started.
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamsWindow;
