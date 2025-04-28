import React, { useState, useMemo } from 'react';
import { useTeams } from './useTeams'; // Adjust path as needed
import { useFilterContext } from '../../filter/FilterContext'; // Adjust path as needed
import { Team } from '../../models/index'; // Adjust path as needed
// Removed CSS Module import - assuming window.css is loaded globally

// Define types for dropdown options for better type safety
type NameDisplayType = 'codeShort' | 'codeLong' | 'longOnly';
type EndColumnDataType =
  | 'seasonsCount'
  | 'meetsCount'
  | 'athletesCount'
  | 'resultsCount'
  | 'currentSeason'
  | 'none';

function TeamsWindow() {
  // --- State for UI Controls ---
  const [nameDisplay, setNameDisplay] = useState<NameDisplayType>('codeShort');
  const [endColumnData, setEndColumnData] = useState<EndColumnDataType>('none');

  // --- Data Fetching ---
  const { data: teams, isLoading, isError, error } = useTeams();

  // --- Selection State ---
  const { state: filterState, toggleSelection } = useFilterContext();
  const selectedTeamIds = filterState.selected.team;
  const superSelectedTeamIds = filterState.superSelected.team;

  // --- Derived State for Visual Filtering ---
  const hasAnyTeamSelected = useMemo(
    () => selectedTeamIds.length > 0,
    [selectedTeamIds]
  );
  const hasAnyTeamSuperSelected = useMemo(
    () => superSelectedTeamIds.length > 0,
    [superSelectedTeamIds]
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
      case 'codeLong':
        return `${team.code} ${team.nameLong}`;
      case 'longOnly':
        return team.nameLong;
      case 'codeShort':
      default:
        return `${team.code} ${team.nameShort}`;
    }
  };

  // Placeholder function for end column data - replace with real data later
  const renderEndColumn = (team: Team): string | number => {
    switch (endColumnData) {
      case 'seasonsCount':
        return 'N/A'; // Replace with actual count later
      case 'meetsCount':
        return 'N/A'; // Replace with actual count later
      case 'athletesCount':
        return 'N/A'; // Replace with actual count later
      case 'resultsCount':
        return 'N/A'; // Replace with actual count later
      case 'currentSeason':
        // Attempt to display a shorter version if currentSeason is a long ID, otherwise show N/A
        return team.currentSeason
          ? `...${team.currentSeason.slice(-6)}`
          : 'N/A';
      case 'none':
      default:
        return ''; // Return empty string
    }
  };

  // --- Main Render ---
  return (
    // Use class names directly from window.css
    <div className="window">
      <div className="row">
        <p>Teams ({teams?.length ?? 0})</p>
        <div className="buttons">
          <button onClick={() => console.log('Add Team clicked')}>Add</button>
        </div>
      </div>

      <div className="options">
        <select value={nameDisplay} onChange={handleNameDisplayChange}>
          <option value="codeShort">Code + Short Name</option>
          <option value="codeLong">Code + Long Name</option>
          <option value="longOnly">Long Name Only</option>
        </select>
        <select value={endColumnData} onChange={handleEndColumnChange}>
          <option value="none">-- Select Column --</option>
          <option value="seasonsCount">Seasons Count</option>
          <option value="meetsCount">Meets Count</option>
          <option value="athletesCount">Athletes Count</option>
          <option value="resultsCount">Results Count</option>
          <option value="currentSeason">Current Season</option>
        </select>
      </div>

      <div className="list">
        {/* Loading State - using a simple div, add styling to window.css if needed */}
        {isLoading && <div className="loading-message">Loading teams...</div>}

        {/* Error State - using a simple div, add styling to window.css if needed */}
        {isError && (
          <div className="error-message">
            Error loading teams: {error?.message}
          </div>
        )}

        {/* Team List */}
        {!isLoading &&
          !isError &&
          teams?.map((team: Team, index: number) => {
            const isSelected: boolean = selectedTeamIds.includes(team.id);
            const isSuperSelected: boolean = superSelectedTeamIds.includes(
              team.id
            );

            // Determine visual state based on global selections
            let itemClasses: string[] = ['item']; // Start with base class
            let itemStyle: React.CSSProperties = {}; // For inline styles if needed

            if (isSuperSelected) {
              itemClasses.push('super'); // Add .super class
              itemClasses.push('selected'); // Add .selected class (as defined in window.css for super)
            } else if (isSelected) {
              itemClasses.push('selected'); // Add .selected class
            }

            // Apply fade or hide based on global state
            if (hasAnyTeamSuperSelected && !isSuperSelected) {
              // If any team is superSelected, hide items that are NOT superSelected
              // NOTE: Using inline style as '.hide' class is not in provided window.css
              itemStyle.display = 'none';
            } else if (hasAnyTeamSelected && !isSelected && !isSuperSelected) {
              // If any team is selected (but none superSelected), fade items that are not selected
              itemClasses.push('faded'); // Add .faded class
            }

            return (
              <div
                key={team.id}
                className={itemClasses.join(' ')} // Join all applicable classes
                style={itemStyle} // Apply inline styles (for hide)
                onClick={() => toggleSelection('team', team.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    toggleSelection('team', team.id);
                }}
              >
                {/* Structure matching window.css expectations */}
                <p className="count">{index + 1}</p>
                <p className="code">{team.code}</p>
                <p className="name">{renderTeamName(team)}</p>
                <p className="end">{renderEndColumn(team)}</p>
              </div>
            );
          })}

        {/* Empty State - using a simple div, add styling to window.css if needed */}
        {!isLoading && !isError && teams?.length === 0 && (
          <div className="empty-message">No teams found.</div>
        )}
      </div>
    </div>
  );
}

export default TeamsWindow;
