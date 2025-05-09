// src/window/events/Events.tsx

import React, { useState, useMemo } from 'react';
import { useEvents } from './useEvents';
import { useFilterContext } from '../../filter/FilterContext';
import { useFormContext } from '../../form/FormContext';
import { Event } from '../../types/data';
import '../../styles/window.css';

type NameDisplayType = 'codeOnly' | 'codeShort' | 'codeLong';
type EndColumnDataType = 'none' | 'resultCount' | 'hs' | 'ms' | 'U14' | 'O15';

function EventsWindow() {
  const [nameDisplay, setNameDisplay] = useState<NameDisplayType>('codeShort');
  const [endColumnData, setEndColumnData] =
    useState<EndColumnDataType>('resultCount');

  const { data: sortedEvents, isLoading, isError, error } = useEvents();

  const {
    state: filterState,
    toggleSelection,
    clearAllByType,
  } = useFilterContext();
  const { selectItemForForm } = useFormContext();

  // Memoize selectedEventIds and superSelectedEventIds
  const selectedEventIds = useMemo(
    () => filterState.selected.event || [],
    [filterState.selected.event]
  );

  const superSelectedEventIds = useMemo(
    () => filterState.superSelected.event || [],
    [filterState.superSelected.event]
  );

  const isAnySelectionActive = useMemo(
    () => selectedEventIds.length > 0 || superSelectedEventIds.length > 0,
    [selectedEventIds, superSelectedEventIds] // Now depends on memoized, stable values
  );

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

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.shiftKey) {
      event.preventDefault();
    }
  };

  const handleItemClick = (
    eventItem: Event,
    domEvent: React.MouseEvent<HTMLDivElement>
  ) => {
    if (domEvent.shiftKey) {
      selectItemForForm('event', eventItem.id, 'view');
    } else {
      toggleSelection('event', eventItem.id);
    }
  };

  const handleAddClick = () => {
    selectItemForForm('event', null, 'add');
  };

  const handleClearClick = () => {
    clearAllByType('event');
  };

  const renderEventName = (eventItem: Event): string => {
    switch (nameDisplay) {
      case 'codeOnly':
        return ''; // Assuming code is rendered separately or not at all here
      case 'codeLong':
        return eventItem.nameLong;
      case 'codeShort':
      default:
        return eventItem.nameShort;
    }
  };

  const renderEndColumn = (eventItem: Event): string | number => {
    switch (endColumnData) {
      case 'resultCount':
        return eventItem.resultCount ?? 0;
      case 'hs':
        return eventItem.hs ? 'Yes' : 'No';
      case 'ms':
        return eventItem.ms ? 'Yes' : 'No';
      case 'U14':
        return eventItem.U14 ? 'Yes' : 'No';
      case 'O15':
        return eventItem.O15 ? 'Yes' : 'No';
      case 'none':
      default:
        return '';
    }
  };

  return (
    <div className="window">
      <div className="row">
        <p>Events ({isLoading ? '...' : (sortedEvents?.length ?? 0)})</p>
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
          <option value="resultCount">Result Count</option>
          <option value="hs">HS Official</option>
          <option value="ms">MS Official</option>
          <option value="U14">U14 Official</option>
          <option value="O15">O15 Official</option>
          <option value="none">None</option>
        </select>
      </div>

      <div className="list">
        {isLoading && <div className="loading-message">Loading events...</div>}
        {isError && error && (
          <div className="error-message">
            Error loading events: {error.message}
          </div>
        )}

        {!isLoading &&
          !isError &&
          sortedEvents &&
          sortedEvents.map((eventItem: Event, index: number) => {
            const isSelected: boolean = selectedEventIds.includes(eventItem.id);
            const isSuperSelected: boolean = superSelectedEventIds.includes(
              eventItem.id
            );

            let itemClasses: string[] = ['item'];
            if (isSuperSelected) {
              itemClasses.push('super', 'selected');
            } else if (isSelected) {
              itemClasses.push('selected');
            }

            return (
              <div
                key={eventItem.id}
                className={itemClasses.join(' ')}
                onMouseDown={handleMouseDown}
                onClick={(e) => handleItemClick(eventItem, e)}
                role="button"
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (e.shiftKey && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    selectItemForForm('event', eventItem.id, 'view');
                  } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSelection('event', eventItem.id);
                  }
                }}
              >
                <p className="count">{index + 1}</p>
                <p className="code">{eventItem.code}</p>
                <p className="name">{renderEventName(eventItem)}</p>
                <p className="end">{renderEndColumn(eventItem)}</p>
              </div>
            );
          })}
        {!isLoading &&
          !isError &&
          (!sortedEvents || sortedEvents.length === 0) && (
            <div className="empty-message">
              No events found. Add an event to get started.
            </div>
          )}
      </div>
    </div>
  );
}

export default EventsWindow;
