"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogPlacementEngine = void 0;
const jsStrategy_1 = require("./strategies/jsStrategy");
const dartStrategy_1 = require("./strategies/dartStrategy");
class LogPlacementEngine {
    jsStrategy;
    dartStrategy;
    constructor() {
        this.jsStrategy = new jsStrategy_1.JSPlacementStrategy();
        this.dartStrategy = new dartStrategy_1.DartPlacementStrategy();
    }
    async getPlacement(document, selection, variableName) {
        const isDart = document.languageId === 'dart';
        if (isDart) {
            return this.dartStrategy.calculate(document, selection, variableName);
        }
        else {
            // Assume JS/TS for other cases (or we could check for specific IDs)
            return this.jsStrategy.calculate(document, selection, variableName);
        }
    }
}
exports.LogPlacementEngine = LogPlacementEngine;
//# sourceMappingURL=logPlacementEngine.js.map