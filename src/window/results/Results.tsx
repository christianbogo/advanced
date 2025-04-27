import '../../styles/window.css';

function Results() {
  return (
    <div className="window">
      <div className="row">
        <p>Results (931)</p>
        <div className="buttons">
          <button disabled>Add</button>
          <button>Search</button>
        </div>
      </div>
      {/* <input className="search" type="text" placeholder="Search" /> */}
      <div className="options">
        <select>
          <option>Group by Event</option>
          <option>Group by Person</option>
        </select>
        <select>
          <option>Sort by Result</option>
          <option>Sort by Name</option>
          <option>Sort by Date</option>
        </select>
      </div>
      <div className="list"></div>
    </div>
  );
}
export default Results;
