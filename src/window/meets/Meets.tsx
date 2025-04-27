import '../../styles/window.css';

function Meets() {
  return (
    <div className="window">
      <div className="row">
        <p>Meets (15)</p>
        <div className="buttons">
          <button disabled>Add</button>
          <button>Search</button>
        </div>
      </div>
      {/* <input className="search" type="text" placeholder="Search" /> */}
      <div className="options">
        <select>
          <option>TeamCode ShortName</option>
          <option>LongName</option>
          <option>TeamCode LongName</option>
        </select>
        <select>
          <option>Date</option>
          <option>Type</option>
          <option>Date Type</option>
          <option>Location</option>
          <option>Results Count</option>
          <option>Season</option>
        </select>
      </div>
      <div className="list">
        <div className="item selected">
          <p className="count">1</p>
          <p className="code">VM</p>
          <p className="name">Velocity Winter</p>
          <p className="end">3/12/25</p>
        </div>
        <div className="item selected">
          <p className="count">2</p>
          <p className="code">WHSG</p>
          <p className="name">Wenatchee HS Girls</p>
          <p className="end">33</p>
        </div>
        <div className="item">
          <p className="count">3</p>
          <p className="code">WMSB</p>
          <p className="name">Wenatchee MS Boys</p>
          <p className="end">41</p>
        </div>
        <div className="item faded">
          <p className="count">4</p>
          <p className="code">WD</p>
          <p className="name">Wenatchee Dragons</p>
          <p className="end">20</p>
        </div>
      </div>
    </div>
  );
}
export default Meets;
