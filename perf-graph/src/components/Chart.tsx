import { useEffect, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  DefaultTooltipContent,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";

export interface PerformanceData {
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

const UNIT = "ms";
const DIV = 1_000_000;

// Convert @typeberry/jam@0.5.6 -> v0.5.x
function getMinorVersion(fullVersion: string): string {
  const match = fullVersion.match(/@(\d+\.\d+)\.\d+$/);
  if (match) {
    return `v${match[1]}.x`;
  }
  return fullVersion;
}

interface ChartProps {
  name: string;
  visibleVersions: Set<string>;
  onVersionsFound: (versions: string[]) => void;
}

export function Chart({ name, visibleVersions, onVersionsFound }: ChartProps) {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [allData, setAllData] = useState<PerformanceData[]>([]);
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

          const parse = (v: string) => Number.parseFloat((Number.parseInt(v) / DIV).toFixed(1));
          const parseF = (v: string) => Number.parseFloat(v) / DIV;

          // Convert to minor version format (v0.5.x)
          const minorVersion = getMinorVersion(projectName);

          return {
            projectName: minorVersion,
            date,
            count: parse(count),
            sum: parse(sum),
            mean: parse(mean),
            median: parse(median),
            min: parse(min),
            max: parse(max),
            range: parse(range),
            stdDeviation: parseF(stdDeviation),
            variance: parseF(variance),
            p1: parse(p1),
            p5: parse(p5),
            p10: parse(p10),
            p25: parse(p25),
            p50: parse(p50),
            p75: parse(p75),
            p90: parse(p90),
            p95: parse(p95),
            p99: parse(p99),
            timestamp: new Date(date).getTime(),
          };
        });

        parsedData.sort((a, b) => a.timestamp - b.timestamp);

        const versions = Array.from(new Set(parsedData.map((d) => d.projectName)));
        onVersionsFound(versions);
        setAllData(parsedData);
      } catch (error) {
        console.error("Error loading CSV data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [name, onVersionsFound]);

  useEffect(() => {
    if (allData.length === 0) return;

    // Filter by visible versions
    const filteredData = allData.filter((item) => visibleVersions.has(item.projectName));

    // Group by version (projectName) and keep only last 5 results per version
    const groupedByVersion = filteredData.reduce(
      (acc, item) => {
        if (!acc[item.projectName]) {
          acc[item.projectName] = [];
        }
        acc[item.projectName].push(item);
        return acc;
      },
      {} as Record<string, PerformanceData[]>,
    );

    // Take last 5 from each group
    const limitedData = Object.values(groupedByVersion)
      .flatMap((group) => group.slice(-5))
      .sort((a, b) => a.timestamp - b.timestamp);

    setData(limitedData);
  }, [allData, visibleVersions]);

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
        <h4>Block import time ({UNIT})</h4>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tickFormatter={formatXAxisLabel} scale="auto" domain={["dataMin", "dataMax"]} />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value: number, name: string) => [value.toLocaleString(), name]}
              content={renderTooltip}
            />
            <Legend />
            <Line type="monotone" dataKey="min" stroke="#2563eb" name="Min" />
            <Line type="monotone" dataKey="max" stroke="#dc2626" name="Max" />
            <Area type="monotone" dataKey="mean" stroke="#8884d8" name="Mean" />
            <Line type="monotone" dataKey="median" stroke="#82ca9d" name="Median" />
            <Bar dataKey="p90" fill="#ff7300" barSize={5} name="90th Percentile" />
            <Line type="monotone" dataKey="p99" stroke="#ffc658" name="99th Percentile" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function renderTooltip(props: TooltipContentProps<number, string>) {
  const rest = DefaultTooltipContent(props);
  const name = props.payload[0]?.payload.projectName ?? "";
  return (
    <>
      <span style={STYLES}>{name}</span>
      {rest}
    </>
  );
}
const STYLES = { background: "white", color: "black", padding: "4px" };
