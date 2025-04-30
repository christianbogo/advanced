import React, { useState, useMemo } from 'react';
import { useTeams } from './useTeams'; // Adjust path as needed
import { useFilterContext } from '../../filter/FilterContext'; // Adjust path as needed
import { Team } from '../../models/index'; // Adjust path as needed
// Assuming window.css is loaded globally or imported elsewhere

// --- Configuration Types ---
type NameDisplayType = 'codeOnly' | 'codeShort' | 'codeLong';
type EndColumnDataType =
  | 'none'
  | 'seasonsCount'
  | 'meetsCount'
  | 'athletesCount'
  | 'resultsCount'
  | 'latestSeason';

function TeamsWindow() {
  // --- State for UI Controls ---
  const [nameDisplay, setNameDisplay] = useState<NameDisplayType>('codeShort');
  const [endColumnData, setEndColumnData] =
    useState<EndColumnDataType>('seasonsCount');

  // --- Data Fetching ---
  const { data: teams, isLoading, isError, error } = useTeams();

  // --- Selection State ---
  const { state: filterState, toggleSelection } = useFilterContext();
  const selectedTeamIds = filterState.selected.team;
  const superSelectedTeamIds = filterState.superSelected.team;

  // --- Derived State for Visual Filtering ---
  // Check if *any* team is selected or super-selected globally
  const hasAnyTeamSelected = useMemo(
    () => selectedTeamIds.length > 0,
    [selectedTeamIds]
  );
  const hasAnyTeamSuperSelected = useMemo(
    () => superSelectedTeamIds.length > 0,
    [superSelectedTeamIds]
  );
  // Combine checks: Is there *any* form of selection active?
  const isAnySelectionActive = useMemo(
    () => hasAnyTeamSelected || hasAnyTeamSuperSelected,
    [hasAnyTeamSelected, hasAnyTeamSuperSelected]
  );

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

  // --- Rendering Logic ---
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
        return 'N/A (Seasons)'; // Placeholder
      case 'meetsCount':
        return 'N/A (Meets)'; // Placeholder
      case 'athletesCount':
        return 'N/A (Athletes)'; // Placeholder (Latest Season)
      case 'resultsCount':
        return 'N/A (Results)'; // Placeholder
      case 'latestSeason':
        return 'N/A (Latest Season)'; // Placeholder (Name Short)
      case 'none':
      default:
        return '';
    }
  };

  // --- Main Render ---
  return (
    <div className="window">
      {/* Header Row */}
      <div className="row">
        <p>Teams ({teams?.length ?? 0})</p>
        <div className="buttons">
          <button onClick={() => console.log('Add Team clicked')}>Add</button>
        </div>
      </div>

      {/* Options Row (Dropdowns) */}
      <div className="options">
        <select value={nameDisplay} onChange={handleNameDisplayChange}>
          <option value="codeShort">Code + Short Name</option>
          <option value="codeLong">Code + Long Name</option>
          <option value="codeOnly">Code Only</option>
        </select>
        <select value={endColumnData} onChange={handleEndColumnChange}>
          <option value="none">-- Additional Info --</option>
          <option value="seasonsCount">Seasons Count</option>
          <option value="meetsCount">Meets Count</option>
          <option value="athletesCount">Athletes Count (Latest Season)</option>
          <option value="resultsCount">Results Count</option>
          <option value="latestSeason">Latest Season Name</option>
        </select>
      </div>

      {/* Data List */}
      <div className="list">
        {/* Loading State */}
        {isLoading && <div className="loading-message">Loading teams...</div>}

        {/* Error State */}
        {isError && (
          <div className="error-message">
            Error loading teams: {error?.message}
          </div>
        )}

        {/* Team List Items */}
        {!isLoading &&
          !isError &&
          teams?.map((team: Team, index: number) => {
            // Determine the selection state for *this specific team*
            const isSelected: boolean = selectedTeamIds.includes(team.id);
            const isSuperSelected: boolean = superSelectedTeamIds.includes(
              team.id
            );

            // --- Refined Class Logic ---
            // Start with the base class
            let itemClasses: string[] = ['item'];

            if (isSuperSelected) {
              // If this team is super-selected, add 'super' and 'selected'
              // (window.css targets .item.super.selected)
              itemClasses.push('super', 'selected');
            } else if (isSelected) {
              // If this team is selected (but not super-selected), add 'selected'
              itemClasses.push('selected');
            } else if (isAnySelectionActive) {
              // If this team is *not* selected/super-selected,
              // BUT *some other* team *is* selected or super-selected,
              // then fade this one out using the 'faded' class.
              itemClasses.push('faded');
            }
            // If no teams are selected or super-selected at all,
            // items that are not selected/super-selected will just have the base 'item' class.

            // --- Removed Inline Style ---
            // We no longer apply display: 'none' here.

            return (
              <div
                key={team.id}
                className={itemClasses.join(' ')} // Apply classes based on the logic above
                // style={itemStyle} // REMOVED: No longer using inline styles for hiding
                onClick={() => toggleSelection('team', team.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    toggleSelection('team', team.id);
                }}
              >
                <p className="count">{index + 1}</p>
                <p className="code">{team.code}</p>
                <p className="name">{renderTeamName(team)}</p>
                <p className="end">{renderEndColumn(team)}</p>
              </div>
            );
          })}

        {/* Empty State */}
        {!isLoading && !isError && teams?.length === 0 && (
          <div className="empty-message">
            No teams found. Add a team to get started.
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamsWindow;
