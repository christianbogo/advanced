import '../../styles/window.css';

function Teams() {
  return (
    <div className="window">
      <div className="row">
        <p>Teams (4)</p>
        <div className="buttons">
          <button>Add</button>
        </div>
      </div>
      <div className="options">
        <select>
          <option>TeamCode ShortName</option>
          <option>TeamCode LongName</option>
          <option>LongName</option>
        </select>
        <select>
          <option>Seasons Count</option>
          <option>Meets Count</option>
          <option>Athletes Count</option>
          <option>Results Count</option>
          <option>Current Season</option>
        </select>
      </div>
      <div className="list">
        <div className="item super selected">
          <p className="count">1</p>
          <p className="code">VM</p>
          <p className="name">Velocity Masters</p>
          <p className="end">22</p>
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
export default Teams;
