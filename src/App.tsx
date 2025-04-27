import Meets from './window/meets/Meets';
import './styles/layout.css';

function App() {
  return (
    <div className="app">
      <div className="data-viewport">
        <div className="data-viewport-column">
          <div className="data-viewport-column-container">
            <Meets />
          </div>
          <div className="data-viewport-column-container">
            <Meets />
          </div>
          <div className="data-viewport-column-container">
            <Meets />
          </div>
        </div>
        <div className="data-viewport-column">
          <div className="data-viewport-column-container">
            <Meets />
          </div>
          <div className="data-viewport-column-container">
            <Meets />
          </div>
        </div>
        <div className="data-viewport-column">
          <div className="data-viewport-column-container">
            <Meets />
          </div>
        </div>
      </div>
      <div className="form-viewport">
        <p>test 8</p>
      </div>
    </div>
  );
}

export default App;
