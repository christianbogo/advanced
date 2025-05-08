import React, { useMemo } from 'react';
import { useResults, ResultWithContextInfo } from './useResults';
import { useFilterContext } from '../../filter/FilterContext';
import { useFormContext } from '../../form/FormContext';
import { hundredthsToTimeString } from '../../utils/time';
import '../../styles/window.css';

function ResultsWindow() {
  const { data: results, isLoading, isError, error } = useResults();

  const {
    state: filterState,
    toggleSelection,
    clearAllByType,
  } = useFilterContext();
  const { selectItemForForm } = useFormContext();

  const selectedResultIds = filterState.selected.result;
  const superSelectedResultIds = filterState.superSelected.result;

  const isAnyResultSelectionActive = useMemo(
    () => selectedResultIds.length > 0 || superSelectedResultIds.length > 0,
    [selectedResultIds, superSelectedResultIds]
  );

  const displayedResults = results ?? [];

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.shiftKey) event.preventDefault();
  };

  const handleItemClick = (
    result: ResultWithContextInfo,
    isClickable: boolean,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!isClickable) return;

    if (event.shiftKey) {
      selectItemForForm('result', result.id, 'view');
    } else {
      toggleSelection('result', result.id);
    }
  };

  const handleAddClick = () => selectItemForForm('result', null, 'add');
  const handleClearClick = () => clearAllByType('result');

  return (
    <div className="window">
      <div className="row">
        <p>Results ({isLoading ? '...' : displayedResults.length})</p>
        <div className="buttons">
          <button onClick={handleAddClick}>Add</button>
          <button
            onClick={handleClearClick}
            disabled={!isAnyResultSelectionActive}
          >
            Clear
          </button>
        </div>
      </div>

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
            let isFaded = false;

            if (
              filterState.selected.team.length > 0 &&
              !filterState.superSelected.team.length
            ) {
              if (!filterState.selected.team.includes(result.team)) {
                isFaded = true;
              }
            }
            if (
              !isFaded &&
              filterState.selected.season.length > 0 &&
              !filterState.superSelected.season.length
            ) {
              if (!filterState.selected.season.includes(result.season)) {
                isFaded = true;
              }
            }
            if (
              !isFaded &&
              filterState.selected.meet.length > 0 &&
              !filterState.superSelected.meet.length
            ) {
              if (!filterState.selected.meet.includes(result.meet)) {
                isFaded = true;
              }
            }
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
              if (intersection.size === 0) {
                isFaded = true;
              }
            }
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
              if (intersection.size === 0) {
                isFaded = true;
              }
            }

            const isClickable = !isFaded;

            const isSelected = selectedResultIds.includes(result.id);
            const isSuperSelected = superSelectedResultIds.includes(result.id);

            let itemClasses: string[] = ['item'];
            if (isSuperSelected) {
              itemClasses.push('super', 'selected');
            } else if (isSelected) {
              itemClasses.push('selected');
            }
            if (isFaded && !isSelected && !isSuperSelected) {
              itemClasses.push('faded');
            }

            return (
              <div
                key={result.id}
                className={itemClasses.join(' ')}
                onMouseDown={handleMouseDown}
                onClick={(e) => handleItemClick(result, isClickable, e)}
                role="button"
                tabIndex={isClickable ? 0 : -1}
                aria-disabled={!isClickable}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (!isClickable) return;
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
                <div className="result-details">
                  <p className="name">{result.personNames.join(', ')}</p>
                  <p className="event">{result.eventString}</p>
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
