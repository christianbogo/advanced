import React, { useState, useMemo, useCallback } from 'react';
import { useTeams } from './useTeams';
import {
  useFilterContext,
  SelectableItemType,
} from '../../filter/FilterContext';
import { useFormContext } from '../../form/FormContext';
import { Team } from '../../models/index';

type NameDisplayType = 'codeOnly' | 'codeShort' | 'codeLong';
type EndColumnDataType =
  | 'none'
  | 'seasonsCount'
  | 'meetsCount'
  | 'resultsCount';

function TeamsWindow() {
  const [nameDisplay, setNameDisplay] = useState<NameDisplayType>('codeShort');
  const [endColumnData, setEndColumnData] =
    useState<EndColumnDataType>('seasonsCount');

  const { data: teams, isLoading, isError, error } = useTeams();

  const {
    state: filterState,
    toggleSelection,
    clearAllByType,
  } = useFilterContext();
  const { selectItemForForm } = useFormContext();

  const selectedTeamIds = filterState.selected.team;
  const superSelectedTeamIds = filterState.superSelected.team;

  const isAnySelectionActive = useMemo(
    () => selectedTeamIds.length > 0 || superSelectedTeamIds.length > 0,
    [selectedTeamIds, superSelectedTeamIds]
  );

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
        return a.code.localeCompare(b.code);
      }
      return primarySortResult;
    });
    return teamsToSort;
  }, [teams, endColumnData]);

  const handleNameDisplayChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setNameDisplay(event.target.value as NameDisplayType);
    },
    []
  );

  const handleEndColumnChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setEndColumnData(event.target.value as EndColumnDataType);
    },
    []
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.shiftKey) {
        event.preventDefault();
      }
    },
    []
  );

  const handleItemClick = useCallback(
    (team: Team, event: React.MouseEvent<HTMLDivElement>) => {
      if (event.shiftKey) {
        selectItemForForm('team' as SelectableItemType, team.id, 'view');
      } else {
        toggleSelection('team' as SelectableItemType, team.id);
      }
    },
    [selectItemForForm, toggleSelection]
  );

  const handleItemKeyDown = useCallback(
    (team: Team, event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (event.shiftKey) {
          selectItemForForm('team' as SelectableItemType, team.id, 'view');
        } else {
          toggleSelection('team' as SelectableItemType, team.id);
        }
      }
    },
    [selectItemForForm, toggleSelection]
  );

  const handleAddClick = useCallback(() => {
    selectItemForForm('team' as SelectableItemType, null, 'add');
  }, [selectItemForForm]);

  const handleClearClick = useCallback(() => {
    clearAllByType('team' as SelectableItemType);
  }, [clearAllByType]);

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

  return (
    <div className="window">
      <div className="row">
        <p>Teams ({sortedTeams.length})</p>
        <div className="buttons">
          <button onClick={handleAddClick}>Add</button>
          <button onClick={handleClearClick} disabled={!isAnySelectionActive}>
            Clear
          </button>
        </div>
      </div>

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
          <option value="none">Sort by: Code</option>
        </select>
      </div>

      <div className="list">
        {isLoading && <div className="loading-message">Loading teams...</div>}
        {isError && error && (
          <div className="error-message">
            Error loading teams: {error.message}
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
            }

            return (
              <div
                key={team.id}
                className={itemClasses.join(' ')}
                onMouseDown={handleMouseDown}
                onClick={(e) => handleItemClick(team, e)}
                onKeyDown={(e) => handleItemKeyDown(team, e)}
                role="button"
                aria-pressed={isSelected || isSuperSelected}
                aria-label={`Team ${team.code}, ${renderTeamName(team)}`}
                tabIndex={0}
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
