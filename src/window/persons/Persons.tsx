import '../../styles/window.css';

function Persons() {
  return (
    <div className="window">
      <div className="row">
        <p>People (60)</p>
        <div className="buttons">
          <button disabled>Add</button>
          <button>Search</button>
        </div>
      </div>
      {/* <input className="search" type="text" placeholder="Search" /> */}
      <div className="options">
        <select>
          <option>Relation FirstName LastInitial</option>
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
          <p className="code">Pa</p>
          <p className="name">David C.</p>
          <p className="end">Christian C.</p>
        </div>
        <div className="item">
          <p className="count">2</p>
          <p className="code">Ma</p>
          <p className="name">Cirila C.</p>
          <p className="end">Christian C.</p>
        </div>
        <div className="item">
          <p className="count">3</p>
          <p className="code">Ot</p>
          <p className="name">Charlie C.</p>
          <p className="end">Christian C.</p>
        </div>
      </div>
    </div>
  );
}
export default Persons;
