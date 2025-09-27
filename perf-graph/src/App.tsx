import "./App.css";
import { Chart } from "./components/Chart";

function App() {
  return (
    <>
      <h1>typeberry import stats</h1>
      <div className="app">
        <Chart name="fallback" />
        <Chart name="safrole" />
        <Chart name="storage" />
        <Chart name="storage_light" />
      </div>
    </>
  );
}

export default App;
