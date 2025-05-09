import React, { useMemo } from 'react';
import { useResults } from './useResults'; // Use the refactored hook
import { Result } from '../../types/data'; // Import the base Result type
import { useFilterContext } from '../../filter/FilterContext';
import { useFormContext } from '../../form/FormContext';
import { hundredthsToTimeString } from '../../utils/time';
import '../../styles/window.css';

function ResultsWindow() {
  const { data: results, isLoading, isError, error } = useResults(); // results is Result[]

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
    resultItem: Result,
    isClickable: boolean,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!isClickable) return;

    if (event.shiftKey) {
      selectItemForForm('result', resultItem.id, 'view');
    } else {
      toggleSelection('result', resultItem.id);
    }
  };

  const handleAddClick = () => selectItemForForm('result', null, 'add');
  const handleClearClick = () => clearAllByType('result');

  const getPersonNamesString = (resultItem: Result): string => {
    if (!resultItem.athletes || resultItem.athletes.length === 0)
      return 'Unknown Athlete(s)';
    return (
      resultItem.athletes
        .map((athlete) => {
          const person = athlete.person;
          const firstName = person?.preferredName || person?.firstName;
          const lastName = person?.lastName;
          return `${firstName ?? ''} ${lastName ?? ''}`.trim();
        })
        .filter(Boolean)
        .join(', ') || 'Unnamed Athlete(s)'
    );
  };

  const getEventString = (resultItem: Result): string => {
    const eventObj = resultItem.event;
    if (!eventObj) return 'Unknown Event';
    return `${eventObj.distance || '?'}m ${eventObj.stroke || '?'} ${eventObj.course || '?'}`;
  };

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
        {isError && error && (
          <div className="error-message">
            {' '}
            Error loading results: {error.message}{' '}
          </div>
        )}

        {!isLoading && !isError && displayedResults.length === 0 && (
          <div className="empty-message">
            No results found matching the current filters.
            {(filterState.superSelected.team.length > 0 ||
              filterState.superSelected.season.length > 0 ||
              filterState.superSelected.meet.length > 0 ||
              filterState.superSelected.event.length > 0 ||
              filterState.superSelected.athlete.length > 0 ||
              filterState.superSelected.person.length > 0) &&
              ' (Super-selection active)'}
          </div>
        )}

        {!isLoading &&
          !isError &&
          displayedResults.map((resultItem, index) => {
            let isFaded = false;
            const { selected, superSelected } = filterState;

            if (selected.team.length > 0 && !superSelected.team.length) {
              if (
                !resultItem.team?.id ||
                !selected.team.includes(resultItem.team.id)
              )
                isFaded = true;
            }
            if (
              !isFaded &&
              selected.season.length > 0 &&
              !superSelected.season.length
            ) {
              if (
                !resultItem.season?.id ||
                !selected.season.includes(resultItem.season.id)
              )
                isFaded = true;
            }
            if (
              !isFaded &&
              selected.meet.length > 0 &&
              !superSelected.meet.length
            ) {
              if (
                !resultItem.meet?.id ||
                !selected.meet.includes(resultItem.meet.id)
              )
                isFaded = true;
            }
            if (
              !isFaded &&
              selected.event.length > 0 &&
              !superSelected.event.length
            ) {
              if (
                !resultItem.event?.id ||
                !selected.event.includes(resultItem.event.id)
              )
                isFaded = true;
            }
            if (
              !isFaded &&
              selected.athlete.length > 0 &&
              !superSelected.athlete.length
            ) {
              const selectedAthleteSet = new Set(selected.athlete);
              if (
                !resultItem.athletes.some(
                  (ath) => ath.id && selectedAthleteSet.has(ath.id)
                )
              )
                isFaded = true;
            }
            if (
              !isFaded &&
              selected.person.length > 0 &&
              !superSelected.person.length
            ) {
              const selectedPersonSet = new Set(selected.person);
              if (
                !resultItem.athletes.some(
                  (ath) =>
                    ath.person?.id && selectedPersonSet.has(ath.person.id)
                )
              )
                isFaded = true;
            }

            const isClickable = !isFaded;
            const isSelected = selectedResultIds.includes(resultItem.id);
            const isSuperSelected = superSelectedResultIds.includes(
              resultItem.id
            );

            let itemClasses: string[] = ['item'];
            if (isSuperSelected) itemClasses.push('super', 'selected');
            else if (isSelected) itemClasses.push('selected');
            if (isFaded && !isSelected && !isSuperSelected)
              itemClasses.push('faded');

            return (
              <div
                key={resultItem.id}
                className={itemClasses.join(' ')}
                onMouseDown={handleMouseDown}
                onClick={(e) => handleItemClick(resultItem, isClickable, e)}
                role="button"
                tabIndex={isClickable ? 0 : -1}
                aria-disabled={!isClickable}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (!isClickable) return;
                  if (e.shiftKey && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    selectItemForForm('result', resultItem.id, 'view');
                  } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSelection('result', resultItem.id);
                  }
                }}
              >
                <p className="count">{index + 1}</p>
                <div className="result-details">
                  <p className="name">{getPersonNamesString(resultItem)}</p>
                  <p className="event">{getEventString(resultItem)}</p>
                  {resultItem.dq && <p className="dq-marker">DQ</p>}
                </div>
                <p className="end">
                  {hundredthsToTimeString(resultItem.result)}
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default ResultsWindow;
