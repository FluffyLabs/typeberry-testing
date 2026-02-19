import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { Chart } from "./components/Chart";

const calculateDefaults = (versions: Set<string>): Set<string> => {
  const versionList = Array.from(versions);

  // Sort versions (v0.1.x, v0.2.x, etc.)
  const sortedVersions = versionList.sort((a, b) => {
    // Extract version numbers from v0.5.x format
    const getVer = (s: string) => s.replace(/^v/, "").replace(/\.x$/, "");
    return getVer(a).localeCompare(getVer(b), undefined, { numeric: true });
  });

  // Take last 2 versions
  return new Set(sortedVersions.slice(-2));
};

function App() {
  const [allVersions, setAllVersions] = useState<Set<string>>(new Set());
  const [visibleVersions, setVisibleVersions] = useState<Set<string>>(new Set());
  const [isCustomized, setIsCustomized] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("visibleVersions");
    if (stored) {
      try {
        setVisibleVersions(new Set(JSON.parse(stored)));
        setIsCustomized(true);
      } catch (e) {
        console.error("Failed to parse stored versions", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!isCustomized && allVersions.size > 0) {
      const defaults = calculateDefaults(allVersions);
      setVisibleVersions(defaults);
    }
  }, [allVersions, isCustomized]);

  const handleVersionsFound = useCallback((versions: string[]) => {
    setAllVersions((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const v of versions) {
        if (!next.has(v)) {
          next.add(v);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const toggleVersion = (v: string) => {
    const next = new Set(visibleVersions);
    if (next.has(v)) {
      next.delete(v);
    } else {
      next.add(v);
    }
    setVisibleVersions(next);
    setIsCustomized(true);
    sessionStorage.setItem("visibleVersions", JSON.stringify(Array.from(next)));
  };

  // Sort versions for display (v0.5.x format)
  const sortedVersions = Array.from(allVersions).sort((a, b) => {
    // Extract version numbers from v0.5.x format
    const getVer = (s: string) => s.replace(/^v/, "").replace(/\.x$/, "");
    return getVer(a).localeCompare(getVer(b), undefined, { numeric: true });
  });

  return (
    <>
      <h1>typeberry import stats</h1>

      <div className="filters">
        <h3>Versions:</h3>
        <div className="version-list">
          {sortedVersions.map((v) => (
            <label key={v} className="version-checkbox">
              <input type="checkbox" checked={visibleVersions.has(v)} onChange={() => toggleVersion(v)} />
              {v}
            </label>
          ))}
        </div>
      </div>

      <div className="conformance-section">
        <Chart name="conformance" visibleVersions={visibleVersions} onVersionsFound={handleVersionsFound} />
      </div>

      <div className="app">
        <Chart name="fallback" visibleVersions={visibleVersions} onVersionsFound={handleVersionsFound} />
        <Chart name="safrole" visibleVersions={visibleVersions} onVersionsFound={handleVersionsFound} />
        <Chart name="storage" visibleVersions={visibleVersions} onVersionsFound={handleVersionsFound} />
        <Chart name="storage_light" visibleVersions={visibleVersions} onVersionsFound={handleVersionsFound} />
      </div>
    </>
  );
}

export default App;
