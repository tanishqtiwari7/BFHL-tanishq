import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const ROLL_NUMBER = import.meta.env.VITE_ROLL_NUMBER || "ABCD123";

const filterOptions = [
  { value: "alphabets", label: "Alphabets" },
  { value: "numbers", label: "Numbers" },
  { value: "highest_lowercase_alphabet", label: "Highest lowercase alphabet" },
];

const defaultPayload = '{ "data": ["A", "C", "z"] }';

function App() {
  const [rawInput, setRawInput] = useState(defaultPayload);
  const [error, setError] = useState("");
  const [response, setResponse] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(
    filterOptions.map((option) => option.value),
  );

  useEffect(() => {
    document.title = ROLL_NUMBER;
  }, []);

  const selectedLabelMap = useMemo(() => {
    return filterOptions.reduce((acc, option) => {
      acc[option.value] = option.label;
      return acc;
    }, {});
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResponse(null);

    let payload;
    try {
      payload = JSON.parse(rawInput);
    } catch (parseError) {
      setError("Invalid JSON. Please check the format and try again.");
      return;
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      !Array.isArray(payload.data)
    ) {
      setError("JSON must be an object with a data array.");
      return;
    }

    try {
      const { data } = await axios.post(API_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });
      setResponse(data);
    } catch (requestError) {
      setError("Request failed. Check the API URL and try again.");
    }
  };

  const handleFilterChange = (event) => {
    const values = Array.from(event.target.selectedOptions).map(
      (option) => option.value,
    );
    setSelectedFilters(values);
  };

  const filteredBlocks = useMemo(() => {
    if (!response) {
      return [];
    }

    return selectedFilters.map((filter) => ({
      key: filter,
      label: selectedLabelMap[filter],
      value: response[filter] ?? [],
    }));
  }, [response, selectedFilters, selectedLabelMap]);

  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <div className="header-copy">
            <p className="eyebrow">BFHL Data Processor</p>
            <h1 className="title">Simple input. Clear response.</h1>
            <p className="subtitle">
              Paste your payload, submit to the BFHL API, then focus on the
              output you need.
            </p>
          </div>
          <div className="roll-card">
            <p className="roll-label">Roll Number</p>
            <p className="roll-value">{ROLL_NUMBER}</p>
          </div>
        </header>

        <main className="grid">
          <section className="card">
            <div className="card-header">
              <h2>Request Payload</h2>
              <p>Provide a JSON object with a data array.</p>
            </div>
            <form className="form" onSubmit={handleSubmit}>
              <textarea
                className="payload"
                value={rawInput}
                onChange={(event) => setRawInput(event.target.value)}
                spellCheck={false}
              />
              {error ? <div className="error">{error}</div> : null}
              <button type="submit" className="primary-button">
                Submit JSON
              </button>
            </form>
          </section>

          <section className="card">
            <div className="card-header">
              <h2>Response Filters</h2>
              <p>Select the sections you want to review.</p>
            </div>
            <select
              multiple
              className="filters"
              value={selectedFilters}
              onChange={handleFilterChange}
              disabled={!response}
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="results">
              {!response ? (
                <div className="empty-state">
                  Submit valid JSON to view the response sections.
                </div>
              ) : (
                filteredBlocks.map((block) => (
                  <div key={block.key} className="result-block">
                    <p className="result-title">{block.label}</p>
                    <pre className="result-body">
                      {JSON.stringify(block.value, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
