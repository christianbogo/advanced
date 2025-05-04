// src/window/teams/Teams.tsx

import React, { useState, useMemo } from 'react';
import { useTeams } from './useTeams';
import { useFilterContext } from '../../filter/FilterContext';
import { useFormContext } from '../../form/FormContext';
import { Team } from '../../models/index';

// Configuration Types
type NameDisplayType = 'codeOnly' | 'codeShort' | 'codeLong';
type EndColumnDataType =
  | 'none'
  | 'seasonsCount'
  | 'meetsCount'
  | 'resultsCount';

function TeamsWindow() {
  // State for UI Controls
  const [nameDisplay, setNameDisplay] = useState<NameDisplayType>('codeShort');
  const [endColumnData, setEndColumnData] =
    useState<EndColumnDataType>('seasonsCount');

  // Data Fetching
  const { data: teams, isLoading, isError, error } = useTeams();

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

  // Derived State for Disabling Clear Button
  const isAnySelectionActive = useMemo(
    () => selectedTeamIds.length > 0 || superSelectedTeamIds.length > 0,
    [selectedTeamIds, superSelectedTeamIds]
  );

  // Sorting Logic (No change needed here)
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
        case 'none':
        default:
          return a.code.localeCompare(b.code);
      }
      let primarySortResult = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        primarySortResult = valB - valA;
      } else {
        if (valA == null && valB != null) primarySortResult = 1;
        else if (valA != null && valB == null) primarySortResult = -1;
        else primarySortResult = String(valB).localeCompare(String(valA));
      }
      if (primarySortResult === 0) {
        return a.code.localeCompare(b.code); // Secondary sort by code asc
      }
      return primarySortResult;
    });
    return teamsToSort;
  }, [teams, endColumnData]);

  // --- Event Handlers ---
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

  // NEW: Handler for MouseDown to prevent default Shift behavior (like text selection)
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.shiftKey) {
      event.preventDefault();
    }
  };

  // MODIFIED: Handles click logic based on Shift key
  // Accepts the full team object and the event
  const handleItemClick = (
    team: Team,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    // No isClickable check needed here as teams don't fade based on other selections
    if (event.shiftKey) {
      // Shift+Click: Load into form ONLY
      selectItemForForm('team', team.id, 'view');
    } else {
      // Normal Click: Toggle selection ONLY
      toggleSelection('team', team.id);
    }
  };

  const handleAddClick = () => {
    selectItemForForm('team', null, 'add');
  };
  const handleClearClick = () => {
    clearAllByType('team');
  };

  // Rendering Logic (No change needed here)
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
        <p>Teams ({sortedTeams?.length ?? 0})</p>
        <div className="buttons">
          <button onClick={handleAddClick}>Add</button>
          <button onClick={handleClearClick} disabled={!isAnySelectionActive}>
            {' '}
            Clear{' '}
          </button>
        </div>
      </div>

      {/* Options Row (No change) */}
      <div className="options">
        <select value={nameDisplay} onChange={handleNameDisplayChange}>
          <option value="codeShort">Short Name</option>
          <option value="codeLong">Long Name</option>
          <option value="codeOnly">Code Only</option>
        </select>
        <select value={endColumnData} onChange={handleEndColumnChange}>
          <option value="seasonsCount">Seasons</option>
          <option value="meetsCount">Meets</option>
          <option value="resultsCount">Results</option>
        </select>
      </div>

      {/* Data List */}
      <div className="list">
        {isLoading && <div className="loading-message">Loading teams...</div>}
        {isError && (
          <div className="error-message">
            {' '}
            Error loading teams: {error?.message}{' '}
          </div>
        )}
        {!isLoading &&
          !isError &&
          sortedTeams.map((team: Team, index: number) => {
            const isSelected: boolean = selectedTeamIds.includes(team.id);
            const isSuperSelected: boolean = superSelectedTeamIds.includes(
              team.id
            );

            // Build classes based only on selection status (no fading for teams)
            let itemClasses: string[] = ['item'];
            if (isSuperSelected) {
              itemClasses.push('super', 'selected');
            } else if (isSelected) {
              itemClasses.push('selected');
            }

            return (
              <div
                key={team.id}
                className={itemClasses.join(' ')}
                // MODIFIED: Add onMouseDown, pass team object and event to onClick
                onMouseDown={handleMouseDown}
                onClick={(e) => handleItemClick(team, e)}
                role="button"
                tabIndex={0} // Teams are always clickable
                // MODIFIED: Differentiate keyboard actions
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (e.shiftKey && (e.key === 'Enter' || e.key === ' ')) {
                    // Shift + Enter/Space: Load to form
                    e.preventDefault();
                    selectItemForForm('team', team.id, 'view');
                  } else if (e.key === 'Enter' || e.key === ' ') {
                    // Enter/Space: Toggle selection
                    e.preventDefault();
                    toggleSelection('team', team.id);
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
