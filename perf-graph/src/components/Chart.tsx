import { useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

export function Chart({ name }: { name: string }) {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`/${name}.csv`);
        const csvText = await response.text();

        const lines = csvText.trim().split("\n");
        const parsedData: PerformanceData[] = lines.map((line) => {
          const [
            projectName,
            date,
            count,
            sum,
            mean,
            median,
            min,
            max,
            range,
            stdDeviation,
            variance,
            p1,
            p5,
            p10,
            p25,
            p50,
            p75,
            p90,
            p95,
            p99,
          ] = line.split(",");

          return {
            projectName,
            date,
            count: Number.parseFloat(count),
            sum: Number.parseFloat(sum),
            mean: Number.parseFloat(mean),
            median: Number.parseFloat(median),
            min: Number.parseFloat(min),
            max: Number.parseFloat(max),
            range: Number.parseFloat(range),
            stdDeviation: Number.parseFloat(stdDeviation),
            variance: Number.parseFloat(variance),
            p1: Number.parseFloat(p1),
            p5: Number.parseFloat(p5),
            p10: Number.parseFloat(p10),
            p25: Number.parseFloat(p25),
            p50: Number.parseFloat(p50),
            p75: Number.parseFloat(p75),
            p90: Number.parseFloat(p90),
            p95: Number.parseFloat(p95),
            p99: Number.parseFloat(p99),
            timestamp: new Date(date).getTime(),
          };
        });

        parsedData.sort((a, b) => a.timestamp - b.timestamp);
        setData(parsedData);
      } catch (error) {
        console.error("Error loading CSV data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [name]);

  const formatXAxisLabel = (tickItem: number) => {
    return new Date(tickItem).toLocaleTimeString();
  };

  if (loading) {
    return <div>Loading performance data...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h3>{name}</h3>
      <div style={{ marginBottom: "30px" }}>
        <h4>Block import time (nanoseconds)</h4>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxisLabel}
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value: number, name: string) => [value.toLocaleString(), name]}
            />
            <Legend />
            <Line type="monotone" dataKey="min" stroke="#2563eb" name="Min" />
            <Line type="monotone" dataKey="max" stroke="#dc2626" name="Max" />
            <Line type="monotone" dataKey="mean" stroke="#8884d8" name="Mean" />
            <Line type="monotone" dataKey="median" stroke="#82ca9d" name="Median" />
            <Line type="monotone" dataKey="p95" stroke="#ffc658" name="95th Percentile" />
            <Line type="monotone" dataKey="p99" stroke="#ff7300" name="99th Percentile" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
