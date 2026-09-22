import { FunctionRenderError } from "./errors.ts";
import { NodeSchema, type Node } from "./schema.ts";

function issuePathToPointer(path: ReadonlyArray<PropertyKey>): string {
  if (path.length === 0) return "";
  return "/" + path.map((segment) => String(segment)).join("/");
}

function checkCalls(node: Node, path: string, names: Set<string>): void {
  if ("call" in node) {
    if (!names.has(node.call)) {
      throw new FunctionRenderError("validation", path, `unknown function: ${node.call}`, {
        fnName: node.call,
      });
    }
    return;
  }
  if ("seq" in node) {
    node.seq.forEach((child: Node, i: number) => checkCalls(child, `${path}/seq/${i}`, names));
  } else if ("parallel" in node) {
    node.parallel.forEach((child: Node, i: number) =>
      checkCalls(child, `${path}/parallel/${i}`, names),
    );
  } else if ("switch" in node) {
    for (const [key, caseNode] of Object.entries(node.cases)) {
      checkCalls(caseNode, `${path}/switch/cases/${key}`, names);
    }
    if (node.default) checkCalls(node.default, `${path}/switch/default`, names);
  } else if ("for" in node) {
    checkCalls(node.body, `${path}/for/body`, names);
  } else {
    checkCalls(node.then, `${path}/then`, names);
    if (node.else) checkCalls(node.else, `${path}/else`, names);
  }
}

/**
 * Validate an untrusted spec value against {@link NodeSchema}. When `fnNames`
 * is provided, also verify every `call` references a known function. Throws
 * {@link FunctionRenderError} (kind `"validation"`) on the first problem.
 */
export function validate(specJson: unknown, fnNames?: Iterable<string>): Node {
  const parsed = NodeSchema.safeParse(specJson);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!;
    throw new FunctionRenderError("validation", issuePathToPointer(issue.path), issue.message);
  }
  if (fnNames) {
    checkCalls(parsed.data, "", new Set(fnNames));
  }
  return parsed.data;
}
