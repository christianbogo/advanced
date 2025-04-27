import '../../styles/window.css';

function Seasons() {
  return (
    <div className="window">
      <div className="row">
        <p>Seasons (8)</p>
        <div className="buttons">
          <button disabled>Add</button>
          <button>Search</button>
        </div>
      </div>
      {/* <input className="search" type="text" placeholder="Search" /> */}
      <div className="options">
        <select>
          <option>TeamCode Year</option>
          <option>ShortName Year</option>
          <option>LongName Year</option>
        </select>
        <select>
          <option>Start Date</option>
          <option>Meets Count</option>
          <option>Athletes Count</option>
          <option>Results Count</option>
        </select>
      </div>
      <div className="list">
        <div className="item selected">
          <p className="count">1</p>
          <p className="code">VM</p>
          <p className="name">25</p>
          <p className="end">3/12/25</p>
        </div>
        <div className="item selected">
          <p className="count">2</p>
          <p className="code">WHSG</p>
          <p className="name">24-25</p>
          <p className="end">3/12/25</p>
        </div>
        <div className="item">
          <p className="count">3</p>
          <p className="code">WMSB</p>
          <p className="name">24</p>
          <p className="end">3/12/25</p>
        </div>
        <div className="item faded">
          <p className="count">4</p>
          <p className="code">WD</p>
          <p className="name">22-23</p>
          <p className="end">3/12/25</p>
        </div>
      </div>
    </div>
  );
}
export default Seasons;
