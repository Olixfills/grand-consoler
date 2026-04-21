# Changelog

All notable changes to the "Grand Consoler" extension will be documented in this file.

## [0.1.0] - 2026-04-21

### Added
- **Smart Scope Placement Engine**: Entirely rewritten logic for finding the perfect log location using AST parsing (JS/TS) and heuristics (Dart).
- **Arrow Function Refactoring**: Automatically converts implicit arrow functions `(v) => expr` into block statements `{ console.log(v); return expr; }` without breaking code.
- **Function Name Gravity**: Selecting a function name at its declaration now places the log after the entire definition.
- **Return Statement Awareness**: Selection on a `return` line now places the log above it.
- **Improved Dart Support**: Context-aware placement for both variable declarations and usage sites using `vscode.executeDefinitionProvider`.

### Changed
- Refactored `InsertionService` to use a strategy-based `LogPlacementEngine`.
- Modernized log formatting with consistent branding and padding.

## [0.0.1] - 2026-04-17
- Initial release with basic line-based insertion and sidebar management.
