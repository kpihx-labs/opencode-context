// opencode plugin package entry — `~/.config/opencode/plugins` → scripts/plugins/
// opencode loads an immediate child directory as a package when it can resolve an
// `index.ts`/`index.js` entry (non-recursive glob {plugin,plugins}/*.{ts,js}).
// Source of truth: context-usage.ts (this folder). Re-export as default export.
export { ContextUsagePlugin as default } from "./context-usage"
