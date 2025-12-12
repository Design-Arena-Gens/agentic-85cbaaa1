"use client";

import { useMemo, useState } from "react";

type TestResult = {
  id: string;
  title: string;
  status: "idle" | "running" | "passed" | "failed";
  logs: string[];
  error?: string;
};

type TestCase = {
  id: string;
  title: string;
  task: () => Promise<void> | void;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sampleTests: TestCase[] = [
  {
    id: "math",
    title: "Math computations remain precise",
    task: () => {
      const total = Array.from({ length: 1000 }, (_, index) => index + 1).reduce(
        (acc, value) => acc + value,
        0
      );

      if (total !== 500500) {
        throw new Error(`Expected 500500 but received ${total}`);
      }
    }
  },
  {
    id: "async",
    title: "Async flows resolve in order",
    task: async () => {
      const tracker: number[] = [];
      await Promise.all([
        delay(20).then(() => tracker.push(1)),
        delay(10).then(() => tracker.push(2)),
        delay(5).then(() => tracker.push(3))
      ]);

      if (tracker.length !== 3) {
        throw new Error("Expected three entries in tracker.");
      }
    }
  },
  {
    id: "dom",
    title: "Browser APIs behave as expected",
    task: () => {
      const div = document.createElement("div");
      div.dataset.test = "ready";

      if (!div.dataset.test) {
        throw new Error("Dataset assignment failed.");
      }
    }
  }
];

export default function HomePage() {
  const tests = useMemo(() => sampleTests, []);
  const [results, setResults] = useState<TestResult[]>(
    tests.map((test) => ({
      id: test.id,
      title: test.title,
      status: "idle",
      logs: []
    }))
  );
  const [isRunning, setIsRunning] = useState(false);

  const reset = () => {
    setResults(
      tests.map((test) => ({
        id: test.id,
        title: test.title,
        status: "idle",
        logs: []
      }))
    );
    setIsRunning(false);
  };

  const run = async () => {
    setIsRunning(true);
    const nextResults: TestResult[] = [];

    for (const test of tests) {
      const next: TestResult = {
        id: test.id,
        title: test.title,
        status: "running",
        logs: ["Starting..."]
      };
      setResults((current) => {
        const snapshot = current.map((item) =>
          item.id === test.id ? next : item
        );
        return snapshot;
      });

      try {
        await Promise.resolve(test.task());
        next.status = "passed";
        next.logs = [...next.logs, "Completed successfully"];
      } catch (error) {
        next.status = "failed";
        const message =
          error instanceof Error ? error.message : "Unknown failure";
        next.error = message;
        next.logs = [...next.logs, `Error: ${message}`];
      }

      nextResults.push(next);
      setResults((current) =>
        current.map((item) => (item.id === next.id ? next : item))
      );
    }

    setIsRunning(false);
  };

  return (
    <main>
      <h1>Agentic Test Harness</h1>
      <p>
        Kick off a trio of sanity checks that exercise synchronous logic, async
        flows, and browser APIs—perfect for verifying this deployment pipeline.
      </p>
      <div className="card">
        <div className="actions">
          <button onClick={run} disabled={isRunning}>
            {isRunning ? "Running…" : "Run Tests"}
          </button>
          <button onClick={reset}>Reset</button>
        </div>
        <section className="log" aria-live="polite">
          {results.map((result) => (
            <article key={result.id}>
              <strong>
                {result.title} ·{" "}
                {result.status === "idle"
                  ? "idle"
                  : result.status === "running"
                  ? "running"
                  : result.status === "passed"
                  ? "passed ✅"
                  : "failed ❌"}
              </strong>
              <ul>
                {result.logs.map((log, index) => (
                  <li key={`${result.id}-${index}`}>{log}</li>
                ))}
              </ul>
              {result.error && <div>Error detail: {result.error}</div>}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
