#!/usr/bin/env tsx
/**
 * This script runs picofuzz benchmark tests and generates a comparison report
 * Usage: tsx benchmark-run.ts
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const TESTS = ["fallback", "safrole", "storage", "storage_light"] as const;
const BASELINE_URL = "https://typeberry.fluffylabs.dev";
const RESULT_DIR = "./picofuzz-result";
const REPORT_FILE = "./benchmark-report.md";

type TestName = (typeof TESTS)[number];

interface TestStats {
	timestamp: string;
	peer: string;
	total_duration_ms: number;
	imports: number;
	avg_import_ms: number;
	min_import_ms: number;
	max_import_ms: number;
	p50_import_ms: number;
	p90_import_ms: number;
	p99_import_ms: number;
}

async function downloadBaseline(test: TestName): Promise<TestStats | null> {
	const url = `${BASELINE_URL}/${test}.csv`;
	console.log(`Fetching baseline for ${test} from ${url}...`);

	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.warn(`No baseline found for ${test}`);
			return null;
		}

		const content = await response.text();
		const lines = content.trim().split("\n");

		if (lines.length < 2) {
			console.warn(`Baseline for ${test} has insufficient data`);
			return null;
		}

		// Get the last line (most recent data)
		const lastLine = lines[lines.length - 1];
		const values = lastLine.split(",");

		return {
			timestamp: values[0],
			peer: values[1],
			total_duration_ms: Number.parseFloat(values[2]),
			imports: Number.parseInt(values[3], 10),
			avg_import_ms: Number.parseFloat(values[4]),
			min_import_ms: Number.parseFloat(values[5]),
			max_import_ms: Number.parseFloat(values[6]),
			p50_import_ms: Number.parseFloat(values[7]),
			p90_import_ms: Number.parseFloat(values[8]),
			p99_import_ms: Number.parseFloat(values[9]),
		};
	} catch (error) {
		console.error(`Error fetching baseline for ${test}:`, error);
		return null;
	}
}

function parseCSV(filePath: string): TestStats | null {
	if (!fs.existsSync(filePath)) {
		console.warn(`CSV file not found: ${filePath}`);
		return null;
	}

	const content = fs.readFileSync(filePath, "utf8");
	const lines = content.trim().split("\n");

	if (lines.length < 2) {
		console.warn(`CSV file has insufficient data: ${filePath}`);
		return null;
	}

	const lastLine = lines[lines.length - 1];
	const values = lastLine.split(",");

	return {
		timestamp: values[0],
		peer: values[1],
		total_duration_ms: Number.parseFloat(values[2]),
		imports: Number.parseInt(values[3], 10),
		avg_import_ms: Number.parseFloat(values[4]),
		min_import_ms: Number.parseFloat(values[5]),
		max_import_ms: Number.parseFloat(values[6]),
		p50_import_ms: Number.parseFloat(values[7]),
		p90_import_ms: Number.parseFloat(values[8]),
		p99_import_ms: Number.parseFloat(values[9]),
	};
}

function formatDiff(baseline: number, current: number): string {
	const diff = current - baseline;
	const percentDiff = ((diff / baseline) * 100).toFixed(2);
	const sign = diff > 0 ? "+" : "";
	const emoji =
		Math.abs(diff) < baseline * 0.05
			? "≈"
			: diff > 0
				? "🔴"
				: "🟢";
	return `${emoji} ${sign}${diff.toFixed(2)}ms (${sign}${percentDiff}%)`;
}

async function runTest(test: TestName): Promise<boolean> {
	console.log(`\n==> Running ${test} test...`);

	try {
		execSync(`npm exec tsx --test tests/picofuzz/${test}.test.ts`, {
			stdio: "inherit",
			env: process.env,
		});
		console.log(`✅ ${test} test completed`);
		return true;
	} catch (error) {
		console.error(`❌ ${test} test failed:`, error);
		return false;
	}
}

async function generateReport(
	results: Map<TestName, { baseline: TestStats | null; current: TestStats | null }>,
): Promise<string> {
	let report = "## Picofuzz Benchmark Results\n\n";

	for (const test of TESTS) {
		const result = results.get(test);
		if (!result) continue;

		const { baseline, current } = result;

		report += `### ${test}\n\n`;

		if (!current) {
			report += "❌ Test failed or no results\n\n";
			continue;
		}

		report += "| Metric | Baseline | Current | Difference |\n";
		report += "|--------|----------|---------|------------|\n";

		if (baseline) {
			report += `| Avg Import Time | ${baseline.avg_import_ms.toFixed(2)}ms | ${current.avg_import_ms.toFixed(2)}ms | ${formatDiff(baseline.avg_import_ms, current.avg_import_ms)} |\n`;
			report += `| P50 Import Time | ${baseline.p50_import_ms.toFixed(2)}ms | ${current.p50_import_ms.toFixed(2)}ms | ${formatDiff(baseline.p50_import_ms, current.p50_import_ms)} |\n`;
			report += `| P90 Import Time | ${baseline.p90_import_ms.toFixed(2)}ms | ${current.p90_import_ms.toFixed(2)}ms | ${formatDiff(baseline.p90_import_ms, current.p90_import_ms)} |\n`;
			report += `| P99 Import Time | ${baseline.p99_import_ms.toFixed(2)}ms | ${current.p99_import_ms.toFixed(2)}ms | ${formatDiff(baseline.p99_import_ms, current.p99_import_ms)} |\n`;
			report += `| Total Duration | ${baseline.total_duration_ms.toFixed(2)}ms | ${current.total_duration_ms.toFixed(2)}ms | ${formatDiff(baseline.total_duration_ms, current.total_duration_ms)} |\n`;
		} else {
			report += `| Avg Import Time | N/A | ${current.avg_import_ms.toFixed(2)}ms | Baseline not available |\n`;
			report += `| P50 Import Time | N/A | ${current.p50_import_ms.toFixed(2)}ms | Baseline not available |\n`;
			report += `| P90 Import Time | N/A | ${current.p90_import_ms.toFixed(2)}ms | Baseline not available |\n`;
			report += `| P99 Import Time | N/A | ${current.p99_import_ms.toFixed(2)}ms | Baseline not available |\n`;
			report += `| Total Duration | N/A | ${current.total_duration_ms.toFixed(2)}ms | Baseline not available |\n`;
		}

		report += "\n";
	}

	const runUrl = process.env.GITHUB_SERVER_URL
		? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
		: "N/A";

	report += "\n---\n";
	report += `🤖 Automated benchmark from [workflow run](${runUrl})`;

	return report;
}

async function main() {
	console.log("==> Starting picofuzz benchmark tests...\n");

	// Run all tests
	const testResults = new Map<TestName, boolean>();
	for (const test of TESTS) {
		const success = await runTest(test);
		testResults.set(test, success);
	}

	console.log("\n==> Downloading baselines and generating report...\n");

	// Fetch baselines and parse results
	const results = new Map<
		TestName,
		{ baseline: TestStats | null; current: TestStats | null }
	>();

	for (const test of TESTS) {
		const baseline = await downloadBaseline(test);
		const current = parseCSV(path.join(RESULT_DIR, `${test}.csv`));
		results.set(test, { baseline, current });
	}

	// Generate report
	const report = await generateReport(results);

	// Write report to file
	fs.writeFileSync(REPORT_FILE, report);
	console.log(`\n✅ Report written to ${REPORT_FILE}`);

	// Print summary
	console.log("\n=== Test Summary ===");
	for (const test of TESTS) {
		const success = testResults.get(test);
		const status = success ? "✅" : "❌";
		console.log(`${status} ${test}`);
	}

	// Exit with error if any test failed
	const allPassed = Array.from(testResults.values()).every((v) => v);
	if (!allPassed) {
		console.error("\n❌ Some tests failed");
		process.exit(1);
	}

	console.log("\n✅ All tests passed!");
}

main().catch((error) => {
	console.error("Error running benchmark:", error);
	process.exit(1);
});
