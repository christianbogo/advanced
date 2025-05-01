import Meets from './window/meets/Meets';
import './styles/layout.css';
import Teams from './window/teams/Teams';
import Seasons from './window/seasons/Seasons';
import Athletes from './window/athletes/Athletes';
import Persons from './window/persons/Persons';
import Results from './window/results/Results';
import FormViewportContainer from './form/FormViewportContainer';

function App() {
  return (
    <div className="app">
      <div className="data-viewport">
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
        <div className="data-viewport-column second">
          <div className="data-viewport-column-container">
            <Athletes />
          </div>
          <div className="data-viewport-column-container">
            <Persons />
          </div>
        </div>
        <div className="data-viewport-column third">
          <div className="data-viewport-column-container">
            <Results />
          </div>
        </div>
      </div>
      <div className="form-viewport">
        <FormViewportContainer />
      </div>
    </div>
  );
}

export default App;
