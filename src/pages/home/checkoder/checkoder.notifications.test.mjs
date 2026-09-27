import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pagePath = new URL("./checkoder.jsx", import.meta.url);

test("uses in-app feedback instead of browser dialogs", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.doesNotMatch(source, /\balert\s*\(/);
  assert.doesNotMatch(source, /window\.confirm\s*\(/);
  assert.match(source, /import\s+\{\s*toast\s*\}\s+from\s+['"]sonner['"]/);
  assert.match(source, /Modal\.confirm\s*\(/);
});
