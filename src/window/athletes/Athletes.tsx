import '../../styles/window.css';

function Athletes() {
  return (
    <div className="window">
      <div className="row">
        <p>Athletes (42)</p>
        <div className="buttons">
          <button disabled>Add</button>
          <button>Search</button>
        </div>
      </div>
      <input className="search" type="text" placeholder="Search" />
      <div className="options">
        <select>
          <option>AgeSex FirstName LastName</option>
          <option>Grade FirstName LastName</option>
        </select>
        <select>
          <option>Grade</option>
          <option>Group</option>
          <option>SubGroup</option>
          <option>Lane</option>
        </select>
      </div>
      <div className="list">
        <div className="item">
          <p className="count">1</p>
          <p className="code">21M</p>
          <p className="name">Christian Cutter</p>
          <p className="end">SR</p>
        </div>
        <div className="item">
          <p className="count">2</p>
          <p className="code">24F</p>
          <p className="name">David Navarro</p>
          <p className="end">FR</p>
        </div>
      </div>
    </div>
  );
}
export default Athletes;
