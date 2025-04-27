import '../../styles/form.css';

function ResultsForm() {
  return (
    <div className="form">
      <form>
        <section>
          <p>Person</p>
          <div className="field">
            <label htmlFor="firstName">First Name</label>
            <input type="text" id="firstName" name="firstName" />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last Name</label>
            <input type="text" id="lastName" name="lastName" />
          </div>
        </section>
        <section>
          <p>Athlete</p>
          <div className="field">
            <label htmlFor="athlete">Person</label>
            <button id="athlete" name="athlete">
              Christian Cutter
            </button>
          </div>
        </section>
        <section>
          <p>Actions</p>
          <div className="buttons">
            <button>Save</button>
            <button>Delete</button>
            <button>Close</button>
          </div>
        </section>
      </form>
    </div>
  );
}

export default ResultsForm;
