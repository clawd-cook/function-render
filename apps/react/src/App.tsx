import { examples, standardCatalog } from "@logic-renderer/catalog";
import { FunctionRenderError, run } from "@logic-renderer/runner";
import { useMemo, useState } from "react";

import "./App.css";

type ExampleName = keyof typeof examples;

interface Success {
  ok: true;
  result: unknown;
  state: Record<string, unknown>;
}
interface Failure {
  ok: false;
  error: { message: string; phase?: string; path?: string; funcKey?: string };
}
type Output = Success | Failure;

const exampleNames = Object.keys(examples) as ExampleName[];

function App() {
  const [name, setName] = useState<ExampleName>(exampleNames[0]!);
  const example = examples[name];

  const [specText, setSpecText] = useState(() => JSON.stringify(example.spec, null, 2));
  const [inputText, setInputText] = useState(() => JSON.stringify(example.input ?? null, null, 2));
  const [output, setOutput] = useState<Output | null>(null);
  const [running, setRunning] = useState(false);

  const catalogNames = useMemo(() => Object.keys(standardCatalog).sort(), []);

  function loadExample(next: ExampleName) {
    setName(next);
    setSpecText(JSON.stringify(examples[next].spec, null, 2));
    setInputText(JSON.stringify(examples[next].input ?? null, null, 2));
    setOutput(null);
  }

  async function handleRun() {
    setRunning(true);
    setOutput(null);
    try {
      const spec: unknown = JSON.parse(specText);
      const input: unknown = inputText.trim() ? JSON.parse(inputText) : undefined;
      const { result, state } = await run(spec, { funcs: standardCatalog, input });
      setOutput({ ok: true, result, state });
    } catch (error) {
      if (error instanceof FunctionRenderError) {
        setOutput({
          ok: false,
          error: {
            message: error.message,
            phase: error.phase,
            path: error.path,
            funcKey: error.funcKey,
          },
        });
      } else {
        setOutput({
          ok: false,
          error: { message: error instanceof Error ? error.message : String(error) },
        });
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="app">
      <header>
        <h1>Function Renderer</h1>
        <p className="subtitle">React demo — runs a JSON spec via @logic-renderer/runner</p>
      </header>

      <section className="controls">
        <label>
          Example
          <select value={name} onChange={(event) => loadExample(event.target.value as ExampleName)}>
            {exampleNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <p className="desc">{example.description}</p>
      </section>

      <section className="grid">
        <label className="field">
          Spec (JSON)
          <textarea
            value={specText}
            spellCheck={false}
            onChange={(event) => setSpecText(event.target.value)}
          />
        </label>
        <label className="field">
          Input (JSON)
          <textarea
            value={inputText}
            spellCheck={false}
            onChange={(event) => setInputText(event.target.value)}
          />
        </label>
      </section>

      <button type="button" className="run" disabled={running} onClick={handleRun}>
        {running ? "Running…" : "Run"}
      </button>

      {output ? (
        <section className={output.ok ? "output ok" : "output err"}>
          {output.ok ? (
            <>
              <h2>Result</h2>
              <pre>{JSON.stringify(output.result, null, 2)}</pre>
              <h2>Final state</h2>
              <pre>{JSON.stringify(output.state, null, 2)}</pre>
            </>
          ) : (
            <>
              <h2>Error</h2>
              <pre>{JSON.stringify(output.error, null, 2)}</pre>
            </>
          )}
        </section>
      ) : null}

      <footer>
        <span>Catalog:</span> {catalogNames.join(", ")}
      </footer>
    </main>
  );
}

export default App;
