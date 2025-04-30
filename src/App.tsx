import Meets from './window/meets/Meets';
import './styles/layout.css';
import Teams from './window/teams/Teams';
import ResultsForm from './window/results/ResultsForm';
import Seasons from './window/seasons/Seasons';
import Athletes from './window/athletes/Athletes';
import Persons from './window/persons/Persons';
import Results from './window/results/Results';

function App() {
  return (
    <div className="app">
      {/* <div className="form-options">
        <div className="header">
          <input className="search" type="text" placeholder="Search" />
          <button>Close</button>
        </div>
        <div className="options">
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option selected">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian Cutter</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
          <div className="option">
            <p className="title">Christian C.</p>
            <p className="subtitle">SR WHS Boys</p>
          </div>
        </div>
      </div> */}
      <div className="data-viewport">
        <div className="data-viewport-column first">
          <div className="data-viewport-column-container">
            {/* <Teams /> */}
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
        <ResultsForm />
      </div>
    </div>
  );
}

export default App;
