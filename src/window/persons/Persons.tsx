// src/window/people/PeopleWindow.tsx

import React, { useState, useMemo } from 'react';
import { usePeople } from './usePersons'; // Adjust path as needed
import { Person } from '../../models/index'; // Adjust path as needed
import { useFilterContext } from '../../filter/FilterContext'; // Adjust path as needed
import { useFormContext } from '../../form/FormContext'; // Adjust path as needed
import { dateDisplay } from '../../utils/date'; // Adjust path, assume exists for formatting dates
import { getAgeGenderString } from '../../utils/age'; // Adjust path as needed
import '../../styles/window.css';

// Configuration Types specific to PeopleWindow display options
type PersonNameDisplayType = 'firstNameLastName' | 'lastNameFirstName';
type PersonEndColumnDataType = 'birthday' | 'phone' | 'primaryEmail' | 'none'; // Added 'none' for clarity

function Persons() {
  // --- NEW State for Search ---
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // --- END NEW State ---
  // State for UI Controls (display format, sort column)
  const [nameDisplay, setNameDisplay] =
    useState<PersonNameDisplayType>('firstNameLastName');
  const [endColumnData, setEndColumnData] =
    useState<PersonEndColumnDataType>('birthday'); // Default to showing birthday

  // Data Fetching Hook
  const { data: people, isLoading, isError, error } = usePeople();

  // Context Hooks for selection and form interaction
  const {
    state: filterState,
    toggleSelection, // For selecting items in the list (filter context)
    clearAllByType, // For clearing 'person' selections
  } = useFilterContext();
  const { selectItemForForm } = useFormContext(); // For selecting an item to load into the form

  // Selection State from FilterContext
  const selectedPersonIds = filterState.selected.person;
  const superSelectedPersonIds = filterState.superSelected.person;

  // Derived State to check if any person selection is active (for enabling 'Clear')
  const isAnyPersonSelectionActive = useMemo(
    () => selectedPersonIds.length > 0 || superSelectedPersonIds.length > 0,
    [selectedPersonIds, superSelectedPersonIds]
  );

  // Client-Side Sorting Logic based on selected end column
  // Note: The primary sort (lastName, firstName) comes from the usePeople hook.
  // This useMemo applies secondary sorting based on the selected column.
  // This now filters based on searchTerm FIRST, then sorts the result.
  const filteredAndSortedPeople = useMemo(() => {
    if (!people) return [];

    // 1. Filter based on searchTerm (case-insensitive)
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    const filteredPeople = !lowerSearchTerm
      ? people // If no search term, use all people
      : people.filter((person) => {
          // Combine relevant fields into a searchable string, handling nulls
          const firstName = (person.firstName ?? '').toLowerCase();
          const lastName = (person.lastName ?? '').toLowerCase();
          const preferredName = (person.preferredName ?? '').toLowerCase();
          const primaryEmail = (person.emails?.[0] ?? '').toLowerCase();
          // Optional: Add phone number to search?
          // const phone = (person.phone ?? '').toLowerCase();

          // Check if search term is included in names or email
          return (
            firstName.includes(lowerSearchTerm) ||
            lastName.includes(lowerSearchTerm) ||
            preferredName.includes(lowerSearchTerm) ||
            primaryEmail.includes(lowerSearchTerm)
            // || phone.includes(lowerSearchTerm) // Uncomment to search phone
          );
        });

    // 2. Sort the filtered results based on endColumnData
    if (!endColumnData || endColumnData === 'none') {
      // If no specific sort, return filtered list (relies on original sort from usePeople)
      return filteredPeople;
    }

    // Create a mutable copy of the *filtered* results for sorting
    const peopleToSort = [...filteredPeople];

    peopleToSort.sort((a, b) => {
      let compareResult = 0;
      let valA: string | null | undefined;
      let valB: string | null | undefined;

      switch (endColumnData) {
        case 'birthday':
          valA = a.birthday;
          valB = b.birthday;
          compareResult = (valA ?? '').localeCompare(valB ?? '');
          break;
        case 'phone':
          valA = a.phone;
          valB = b.phone;
          compareResult = String(valA ?? '').localeCompare(String(valB ?? ''));
          break;
        case 'primaryEmail':
          valA = a.emails?.[0];
          valB = b.emails?.[0];
          compareResult = String(valA ?? '').localeCompare(String(valB ?? ''));
          break;
        default:
          compareResult = 0;
      }

      // Secondary sort by name if primary columns are equal
      if (compareResult === 0) {
        const lastNameCompare = (a.lastName ?? '').localeCompare(
          b.lastName ?? ''
        );
        if (lastNameCompare !== 0) return lastNameCompare;
        return (a.firstName ?? '').localeCompare(b.firstName ?? '');
      }
      return compareResult;
    });

    return peopleToSort;
  }, [people, searchTerm, endColumnData]); // Dependencies: base data, search term, sort column
  // --- END UPDATED Memo ---

  // --- Event Handlers ---

  const handleNameDisplayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNameDisplay(e.target.value as PersonNameDisplayType);
  };

  const handleEndColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEndColumnData(e.target.value as PersonEndColumnDataType);
  };

  // Prevent default shift+click text selection behavior
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.shiftKey) {
      event.preventDefault();
    }
  };

  // Handle clicks on list items (differentiates between normal and shift+click)
  const handleItemClick = (
    person: Person,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    // No fading logic, so all items are considered clickable
    if (event.shiftKey) {
      // Shift+Click: Load this person into the form for viewing/editing
      selectItemForForm('person', person.id, 'view');
    } else {
      // Normal Click: Toggle this person's selection state in the filter context
      toggleSelection('person', person.id);
    }
  };

  // Handle 'Add Person' button click
  const handleAddClick = () => {
    // Signal the form context to prepare for adding a new person
    selectItemForForm('person', null, 'add');
  };

  // Handle 'Clear Selection' button click
  const handleClearClick = () => {
    clearAllByType('person'); // Clear only 'person' selections in filter context
  };

  // --- Rendering Logic Helpers ---

  // Renders the content for the 'end' column based on state
  const renderEndColumn = (person: Person): string | number => {
    switch (endColumnData) {
      case 'birthday':
        return dateDisplay(person.birthday) ?? '-'; // Use util for friendly date format
      case 'phone':
        return person.phone ?? '-';
      case 'primaryEmail':
        return person.emails?.[0] ?? '-'; // Display the first email
      case 'none':
      default:
        return ''; // Render nothing if 'none' or default
    }
  };

  // NEW Handler to toggle search visibility
  const toggleSearch = () => setIsSearchVisible((prev) => !prev);

  // NEW Handler for search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Renders the name part based on display format selection
  const renderNameColumn = (person: Person): React.ReactNode => {
    // Prefer 'preferredName' over 'firstName' if available
    const firstName = person.preferredName || person.firstName;
    const lastName = person.lastName;
    let baseName: string;

    // Format the base name string
    switch (nameDisplay) {
      case 'lastNameFirstName':
        baseName = `${lastName ?? ''}, ${firstName ?? ''}`;
        break;
      case 'firstNameLastName':
      default:
        baseName = `${firstName ?? ''} ${lastName ?? ''}`;
        break;
    }

    // Get the age/gender suffix (e.g., "23M", "40", "F")
    const ageGenderSuffix = getAgeGenderString(person);

    // Combine base name and suffix, adding a space only if the suffix exists
    const combinedName = ageGenderSuffix
      ? `${baseName} ${ageGenderSuffix}`.trim()
      : baseName;

    // Render the combined string in a paragraph tag
    // You could use spans for finer CSS control:
    // return <p className="name"><span>{baseName}</span> {ageGenderSuffix && <span className="age-gender">{ageGenderSuffix}</span>}</p>;
    return <p className="name">{combinedName}</p>;
  };

  // --- Main Component Render ---
  return (
    <div className="window">
      {/* Header: Title, Count, Action Buttons */}
      <div className="row">
        <p>People ({isLoading ? '...' : filteredAndSortedPeople.length})</p>
        <div className="buttons">
          <button onClick={handleAddClick}>Add</button>
          <button onClick={toggleSearch}>
            {isSearchVisible ? 'Close' : 'Search'}
          </button>
          <button
            onClick={handleClearClick}
            disabled={!isAnyPersonSelectionActive} // Enable only if selections exist
          >
            Clear
          </button>
        </div>
      </div>
      {isSearchVisible && (
        <input
          className="search" // Use this class for styling
          type="text"
          placeholder="Search Name or Email..."
          value={searchTerm}
          onChange={handleSearchChange}
          autoFocus // Focus the input when it appears
        />
      )}

      {/* Options: Display Format, Sort Column */}
      <div className="options">
        <select value={nameDisplay} onChange={handleNameDisplayChange}>
          <option value="firstNameLastName">First Last</option>
          <option value="lastNameFirstName">Last, First</option>
        </select>
        <select value={endColumnData} onChange={handleEndColumnChange}>
          <option value="birthday">Birthday</option>
          <option value="phone">Phone</option>
          <option value="primaryEmail">Email</option>
          <option value="none">None</option> {/* Allow hiding end column */}
        </select>
      </div>

      {/* Data List Area */}
      <div className="list">
        {/* Loading State */}
        {isLoading && <div className="loading-message">Loading people...</div>}

        {/* Error State */}
        {isError && (
          <div className="error-message">
            Error loading people: {error?.message}
          </div>
        )}

        {/* Data Rendering */}
        {!isLoading &&
          !isError &&
          filteredAndSortedPeople.map((person: Person, index: number) => {
            // Determine selection states for styling
            const isSelected = selectedPersonIds.includes(person.id);
            const isSuperSelected = superSelectedPersonIds.includes(person.id);

            // Build CSS classes based on selection state
            let itemClasses: string[] = ['item']; // Base class
            if (isSuperSelected) {
              itemClasses.push('super', 'selected'); // Super selected style
            } else if (isSelected) {
              itemClasses.push('selected'); // Normal selected style
            }
            // Note: 'faded' class is intentionally not used here for simplicity

            return (
              <div
                key={person.id}
                className={itemClasses.join(' ')}
                onMouseDown={handleMouseDown} // Prevent text selection on shift+click
                onClick={(e) => handleItemClick(person, e)} // Handle item clicks
                role="button" // Accessibility
                tabIndex={0} // Make items focusable and interactive
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  // Keyboard interactions (Enter/Space for toggle, Shift+Enter/Space for form load)
                  if (e.shiftKey && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    selectItemForForm('person', person.id, 'view');
                  } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSelection('person', person.id);
                  }
                }}
              >
                {/* Item Content: Count, Name, End Column */}
                <p className="count">{index + 1}</p>
                {renderNameColumn(person)}
                <p className="end">{renderEndColumn(person)}</p>
              </div>
            );
          })}

        {/* Empty State: Shown when not loading, no error, and no data */}
        {!isLoading && !isError && filteredAndSortedPeople.length === 0 && (
          <div className="empty-message">
            No people found. Use 'Add Person' to create the first one.
          </div>
        )}
      </div>
    </div>
  );
}

export default Persons;
