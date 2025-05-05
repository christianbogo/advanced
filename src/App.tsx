// src/App.tsx

import { useFilterContext } from './filter/FilterContext'; // *** Import the context hook ***
import Meets from './window/meets/Meets';
import './styles/layout.css';
import Teams from './window/teams/Teams';
import Seasons from './window/seasons/Seasons';
import Athletes from './window/athletes/Athletes';
import Persons from './window/persons/Persons';
import Results from './window/results/Results';
import FormViewportContainer from './form/FormViewportContainer';

function App() {
  // *** Get the filter state from the context ***
  const { state: filterState } = useFilterContext();

  // *** Determine if the Athletes column should be rendered ***
  const shouldRenderAthletes =
    filterState.superSelected.team.length > 0 ||
    filterState.superSelected.season.length > 0;

  return (
    <div className="app">
      <div className="data-viewport">
        {/* Column 1: Teams, Seasons, Meets */}
        <div className="data-viewport-column first">
          <div className="data-viewport-column-container">
            <Teams />
          </div>
          <div className="data-viewport-column-container">
            <Seasons />
          </div>
          <div className="data-viewport-column-container">
            <Meets />
          </div>
        </div>

        {/* Column 2: Athletes (Conditional), Persons */}
        <div className="data-viewport-column second">
          {/* *** Conditionally render the Athletes container *** */}
          {shouldRenderAthletes && (
            <div className="data-viewport-column-container">
              <Athletes />
            </div>
          )}
          {/* Persons container always renders (adjust if needed) */}
          <div className="data-viewport-column-container">
            <Persons />
          </div>
        </div>

        {/* Column 3: Results */}
        <div className="data-viewport-column third">
          <div className="data-viewport-column-container">
            <Results />
          </div>
        </div>
      </div>

      {/* Form Viewport */}
      <div className="form-viewport">
        <FormViewportContainer />
      </div>
    </div>
  );
}

export default App;
