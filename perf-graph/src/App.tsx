import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./App.css";

interface PerformanceData {
  projectName: string;
  date: string;
  count: number;
  sum: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  range: number;
  stdDeviation: number;
  variance: number;
  p1: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  timestamp: number;
}

function App() {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/fallback.csv');
        const csvText = await response.text();

        const lines = csvText.trim().split('\n');
        const parsedData: PerformanceData[] = lines.map(line => {
          const [
            projectName, date, count, sum, mean, median, min, max, range,
            stdDeviation, variance, p1, p5, p10, p25, p50, p75, p90, p95, p99
          ] = line.split(',');

          return {
            projectName,
            date,
            count: parseFloat(count),
            sum: parseFloat(sum),
            mean: parseFloat(mean),
            median: parseFloat(median),
            min: parseFloat(min),
            max: parseFloat(max),
            range: parseFloat(range),
            stdDeviation: parseFloat(stdDeviation),
            variance: parseFloat(variance),
            p1: parseFloat(p1),
            p5: parseFloat(p5),
            p10: parseFloat(p10),
            p25: parseFloat(p25),
            p50: parseFloat(p50),
            p75: parseFloat(p75),
            p90: parseFloat(p90),
            p95: parseFloat(p95),
            p99: parseFloat(p99),
            timestamp: new Date(date).getTime()
          };
        });

        parsedData.sort((a, b) => a.timestamp - b.timestamp);
        setData(parsedData);
      } catch (error) {
        console.error('Error loading CSV data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatXAxisLabel = (tickItem: number) => {
    return new Date(tickItem).toLocaleTimeString();
  };

  if (loading) {
    return <div>Loading performance data...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Performance Metrics Dashboard</h1>

      <div style={{ marginBottom: '30px' }}>
        <h2>Response Time Statistics (nanoseconds)</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxisLabel}
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value: number, name: string) => [value.toLocaleString(), name]}
            />
            <Legend />
            <Line type="monotone" dataKey="mean" stroke="#8884d8" name="Mean" />
            <Line type="monotone" dataKey="median" stroke="#82ca9d" name="Median" />
            <Line type="monotone" dataKey="p95" stroke="#ffc658" name="95th Percentile" />
            <Line type="monotone" dataKey="p99" stroke="#ff7300" name="99th Percentile" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Min/Max Range</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxisLabel}
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value: number, name: string) => [value.toLocaleString(), name]}
            />
            <Legend />
            <Line type="monotone" dataKey="min" stroke="#8884d8" name="Min" />
            <Line type="monotone" dataKey="max" stroke="#82ca9d" name="Max" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2>Sample Count Over Time</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxisLabel}
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value: number, name: string) => [value.toLocaleString(), name]}
            />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" name="Sample Count" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;
