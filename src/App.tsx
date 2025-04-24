import './styles/layout.css';

function App() {
  return (
    <div className="app">
      <div className="data-viewport">
        <div className="data-viewport-column">
          <div className="data-viewport-column-container">
            <p>test 1</p>
          </div>
          <div className="data-viewport-column-container">
            <p>test 2</p>
          </div>
          <div className="data-viewport-column-container">
            <p>test 3</p>
          </div>
        </div>
        <div className="data-viewport-column">
          <div className="data-viewport-column-container">
            <p>test 4</p>
          </div>
          <div className="data-viewport-column-container">
            <p>test 5</p>
          </div>
        </div>
        <div className="data-viewport-column">
          <div className="data-viewport-column-container">
            <p>test 6</p>
          </div>
          <div className="data-viewport-column-container">
            <p>test 7</p>
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
