// src/window/events/Events.tsx

import React, { useState, useMemo } from 'react';
import { useEvents } from './useEvents'; // Import the new hook
import { useFilterContext } from '../../filter/FilterContext';
import { useFormContext } from '../../form/FormContext';
import { Event } from '../../models/index'; // Import the Event type

// Configuration Types for UI Controls
type NameDisplayType = 'codeOnly' | 'codeShort' | 'codeLong';
type EndColumnDataType = 'none' | 'resultCount' | 'hs' | 'ms' | 'U14' | 'O15';

function EventsWindow() {
  // State for UI Controls
  const [nameDisplay, setNameDisplay] = useState<NameDisplayType>('codeShort');
  const [endColumnData, setEndColumnData] =
    useState<EndColumnDataType>('resultCount'); // Default to showing resultCount

  // Data Fetching using the new hook
  // Data is already sorted by stroke (asc), distance (asc), resultCount (desc) from the hook
  const {
    data: sortedEvents,
    isLoading,
    isError,
    error,
    status,
    isFetching,
  } = useEvents();

  // Context Hooks
  const {
    state: filterState,
    toggleSelection,
    clearAllByType,
  } = useFilterContext();
  const { selectItemForForm } = useFormContext();

  console.log('--- EventsWindow rendering/status ---', {
    status, // 'loading', 'error', 'success'
    isFetching, // Is a fetch happening now (even background)?
    isLoading, // Only true on initial load without cached data
    isError,
    error: error?.message, // Log just the error message if exists
    hasData: !!sortedEvents,
    count: sortedEvents?.length,
    // Log snapshot of data IDs/codes
    eventDataSnapshot: sortedEvents
      ?.slice(0, 5)
      .map((e) => ({ id: e.id, code: e.code })),
  });
  // <<< END OF

  // Selection State for Events
  const selectedEventIds = filterState.selected.event || []; // Ensure default empty array
  const superSelectedEventIds = filterState.superSelected.event || []; // Ensure default empty array

  // Derived State for Disabling Clear Button
  const isAnySelectionActive = useMemo(
    () => selectedEventIds.length > 0 || superSelectedEventIds.length > 0,
    [selectedEventIds, superSelectedEventIds]
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

  // Prevent default Shift behavior (like text selection)
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.shiftKey) {
      event.preventDefault();
    }
  };

  // Handles click logic based on Shift key for Events
  const handleItemClick = (
    eventItem: Event, // Renamed parameter to avoid conflict with DOM event
    domEvent: React.MouseEvent<HTMLDivElement> // Explicitly name the DOM event
  ) => {
    // Assuming events are always clickable for now (no fading logic yet)
    if (domEvent.shiftKey) {
      // Shift+Click: Load into form ONLY
      selectItemForForm('event', eventItem.id, 'view');
    } else {
      // Normal Click: Toggle selection ONLY
      toggleSelection('event', eventItem.id);
    }
  };

  const handleAddClick = () => {
    selectItemForForm('event', null, 'add'); // Use 'event' type
  };

  const handleClearClick = () => {
    clearAllByType('event'); // Use 'event' type
  };

  // --- Rendering Logic Helpers ---
  const renderEventName = (eventItem: Event): string => {
    switch (nameDisplay) {
      case 'codeOnly':
        return '';
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
        return eventItem.hs ? 'Yes' : 'No'; // Display boolean flags clearly
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

  // --- Main Render ---
  return (
    <div className="window">
      {/* Header Row */}
      <div className="row">
        <p>Events ({sortedEvents?.length ?? 0})</p>
        <div className="buttons">
          <button onClick={handleAddClick}>Add</button>
          <button onClick={handleClearClick} disabled={!isAnySelectionActive}>
            Clear
          </button>
        </div>
      </div>

      {/* Options Row */}
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
        </select>
      </div>

      {/* Data List */}
      <div className="list">
        {isLoading && <div className="loading-message">Loading events...</div>}
        {isError && (
          <div className="error-message">
            Error loading events: {error?.message}
          </div>
        )}
        {!isLoading &&
          !isError &&
          sortedEvents && // Check if sortedEvents exists
          sortedEvents.map((eventItem: Event, index: number) => {
            const isSelected: boolean = selectedEventIds.includes(eventItem.id);
            const isSuperSelected: boolean = superSelectedEventIds.includes(
              eventItem.id
            );

            // Build classes based only on selection status (no fading for now)
            let itemClasses: string[] = ['item'];
            if (isSuperSelected) {
              itemClasses.push('super', 'selected');
            } else if (isSelected) {
              itemClasses.push('selected');
            }

            // Potentially add 'faded' class here in the future based on other filters

            return (
              <div
                key={eventItem.id}
                className={itemClasses.join(' ')}
                onMouseDown={handleMouseDown}
                onClick={(e) => handleItemClick(eventItem, e)} // Pass event data and DOM event
                role="button"
                tabIndex={0} // Events are always clickable for now
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (e.shiftKey && (e.key === 'Enter' || e.key === ' ')) {
                    // Shift + Enter/Space: Load to form
                    e.preventDefault();
                    selectItemForForm('event', eventItem.id, 'view'); // Use 'event' type
                  } else if (e.key === 'Enter' || e.key === ' ') {
                    // Enter/Space: Toggle selection
                    e.preventDefault();
                    toggleSelection('event', eventItem.id); // Use 'event' type
                  }
                }}
              >
                {/* Display Event Data */}
                <p className="count">{index + 1}</p>
                <p className="code">{eventItem.code}</p>
                <p className="name">{renderEventName(eventItem)}</p>
                {/* Render distance and stroke clearly */}

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
