import React, { useMemo } from 'react';
import { useResults, ResultWithContextInfo } from './useResults'; // Adjust path to your hook
import { useFilterContext } from '../../filter/FilterContext'; // Adjust path
import { useFormContext } from '../../form/FormContext'; // Adjust path
import { hundredthsToTimeString } from '../../utils/time'; // Adjust path
import '../../styles/window.css'; // Adjust path if needed

function ResultsWindow() {
  // Data Fetching Hook
  const {
    data: results, // results is ResultWithContextInfo[] | undefined
    isLoading,
    isError,
    error,
  } = useResults();

  // Context Hooks
  const {
    state: filterState,
    toggleSelection,
    clearAllByType,
  } = useFilterContext();
  const { selectItemForForm } = useFormContext();

  // Selection State from FilterContext
  const selectedResultIds = filterState.selected.result;
  const superSelectedResultIds = filterState.superSelected.result;

  // Derived State for UI logic
  const isAnyResultSelectionActive = useMemo(
    () => selectedResultIds.length > 0 || superSelectedResultIds.length > 0,
    [selectedResultIds, superSelectedResultIds]
  );

  // Use results directly for now, add sorting/filtering later if needed
  const displayedResults = results ?? [];

  // --- Event Handlers ---
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    // Prevent text selection on shift+click
    if (event.shiftKey) event.preventDefault();
  };

  const handleItemClick = (
    result: ResultWithContextInfo,
    isClickable: boolean,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!isClickable) return; // Respect fading logic

    if (event.shiftKey) {
      // Shift+Click: Load into form
      selectItemForForm('result', result.id, 'view');
    } else {
      // Normal Click: Toggle selection
      toggleSelection('result', result.id);
    }
  };

  const handleAddClick = () => selectItemForForm('result', null, 'add');
  const handleClearClick = () => clearAllByType('result');

  // --- Rendering Logic ---
  return (
    <div className="window">
      {/* Header */}
      <div className="row">
        <p>Results ({isLoading ? '...' : displayedResults.length})</p>
        <div className="buttons">
          <button onClick={handleAddClick}>Add</button>
          {/* Add Search/Options later if needed */}
          <button
            onClick={handleClearClick}
            disabled={!isAnyResultSelectionActive}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Options Row - Placeholder */}
      {/* <div className="options">
        {/* Add Sorting/Display options later */}
      {/* </div> */}

      {/* Data List */}
      <div className="list">
        {isLoading && <div className="loading-message">Loading results...</div>}
        {isError && (
          <div className="error-message">
            Error loading results: {error?.message}
          </div>
        )}
        {!isLoading && !isError && displayedResults.length === 0 && (
          <div className="empty-message">
            No results found matching the current filters.
            {/* Check if any super-selection is active to provide more context */}
            {(filterState.superSelected.team.length > 0 ||
              filterState.superSelected.season.length > 0 ||
              filterState.superSelected.meet.length > 0 ||
              filterState.superSelected.athlete.length > 0 ||
              filterState.superSelected.person.length > 0) &&
              ' (Super-selection active)'}
          </div>
        )}

        {!isLoading &&
          !isError &&
          displayedResults.map((result, index) => {
            // --- Determine Fading/Clickability based on NORMAL selections ---
            let isFaded = false;

            // Check each relevant NORMAL selection category if it's active
            // An item is faded if it fails to match *any* active normal selection criteria.
            // Check Team
            if (
              filterState.selected.team.length > 0 &&
              !filterState.superSelected.team.length // Only apply normal selection if not superseded by super-selection
            ) {
              if (!filterState.selected.team.includes(result.team)) {
                isFaded = true;
              }
            }
            // Check Season (only if not already faded)
            if (
              !isFaded &&
              filterState.selected.season.length > 0 &&
              !filterState.superSelected.season.length
            ) {
              if (!filterState.selected.season.includes(result.season)) {
                isFaded = true;
              }
            }
            // Check Meet (only if not already faded)
            if (
              !isFaded &&
              filterState.selected.meet.length > 0 &&
              !filterState.superSelected.meet.length
            ) {
              if (!filterState.selected.meet.includes(result.meet)) {
                isFaded = true;
              }
            }
            // Check Athletes (only if not already faded)
            if (
              !isFaded &&
              filterState.selected.athlete.length > 0 &&
              !filterState.superSelected.athlete.length
            ) {
              const resultAthleteSet = new Set(result.athletes || []);
              const selectedAthleteSet = new Set(filterState.selected.athlete);
              const intersection = new Set(
                Array.from(resultAthleteSet).filter((x) =>
                  selectedAthleteSet.has(x)
                )
              );
              // Fade if the result has NO athletes matching the selection
              if (intersection.size === 0) {
                isFaded = true;
              }
            }
            // Check Persons (only if not already faded)
            if (
              !isFaded &&
              filterState.selected.person.length > 0 &&
              !filterState.superSelected.person.length
            ) {
              const resultPersonSet = new Set(result.persons || []);
              const selectedPersonSet = new Set(filterState.selected.person);
              const intersection = new Set(
                Array.from(resultPersonSet).filter((x) =>
                  selectedPersonSet.has(x)
                )
              );
              // Fade if the result has NO persons matching the selection
              if (intersection.size === 0) {
                isFaded = true;
              }
            }
            // Add Event check later if needed

            const isClickable = !isFaded; // An item is not clickable if it's faded

            // --- Determine Selection Highlighting ---
            const isSelected = selectedResultIds.includes(result.id);
            const isSuperSelected = superSelectedResultIds.includes(result.id);

            // --- Build Classes ---
            let itemClasses: string[] = ['item'];
            if (isSuperSelected) {
              itemClasses.push('super', 'selected');
            } else if (isSelected) {
              itemClasses.push('selected');
            }
            // Apply 'faded' class only if faded AND not selected/super-selected
            if (isFaded && !isSelected && !isSuperSelected) {
              itemClasses.push('faded');
            }

            // --- Render Item ---
            return (
              <div
                key={result.id}
                className={itemClasses.join(' ')}
                onMouseDown={handleMouseDown}
                onClick={(e) => handleItemClick(result, isClickable, e)}
                role="button"
                tabIndex={isClickable ? 0 : -1} // Make non-clickable items unfocusable
                aria-disabled={!isClickable}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (!isClickable) return; // Ignore keyboard if not clickable
                  if (e.shiftKey && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    selectItemForForm('result', result.id, 'view');
                  } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSelection('result', result.id);
                  }
                }}
              >
                <p className="count">{index + 1}</p>
                {/* Main Content Area for Result */}
                <div className="result-details">
                  {' '}
                  {/* Optional wrapper */}
                  <p className="name">{result.personNames.join(', ')}</p>
                  <p className="event">{result.eventString}</p>
                  {/* Display DQ status if applicable */}
                  {result.dq && <p className="dq-marker">DQ</p>}
                </div>
                <p className="end">{hundredthsToTimeString(result.result)}</p>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default ResultsWindow;
