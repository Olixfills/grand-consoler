"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DartPlacementStrategy = void 0;
const vscode = __importStar(require("vscode"));
class DartPlacementStrategy {
    async calculate(document, selection, variableName) {
        const line = document.lineAt(selection.active.line);
        const lineText = line.text;
        const indent = line.firstNonWhitespaceCharacterIndex;
        // 1. Is it a return statement?
        if (lineText.trim().startsWith('return')) {
            return {
                type: 'insert',
                position: new vscode.Position(selection.active.line, 0),
                text: `debugPrint("🚀 ~ ${variableName}: \$${variableName}");`,
                indentation: indent
            };
        }
        // 2. Is it a declaration? (Use Definition Provider)
        const isDeclaration = await this.checkIfDeclaration(document, selection.active);
        if (isDeclaration) {
            // Log after the declaration line
            return {
                type: 'insert',
                position: new vscode.Position(selection.active.line + 1, 0),
                text: `debugPrint("🚀 ~ ${variableName}: \$${variableName}");`,
                indentation: indent
            };
        }
        // 3. Stay in local scope (check if we are at the end of a block)
        const nextLineIndex = selection.active.line + 1;
        if (nextLineIndex < document.lineCount) {
            const nextLine = document.lineAt(nextLineIndex);
            if (nextLine.text.trim() === '}') {
                // If next line is closing brace, we definitely want to stay above it
                return {
                    type: 'insert',
                    position: new vscode.Position(selection.active.line + 1, 0),
                    text: `debugPrint("🚀 ~ ${variableName}: \$${variableName}");`,
                    indentation: indent
                };
            }
        }
        // Default: next line insertion
        return {
            type: 'insert',
            position: new vscode.Position(selection.active.line + 1, 0),
            text: `debugPrint("🚀 ~ ${variableName}: \$${variableName}");`,
            indentation: indent
        };
    }
    async checkIfDeclaration(document, position) {
        try {
            const locations = await vscode.commands.executeCommand('vscode.executeDefinitionProvider', document.uri, position);
            if (!locations || locations.length === 0)
                return false;
            const target = locations[0];
            const targetRange = 'range' in target ? target.range : target.targetRange;
            // If the definition is on the same line as the cursor, it's likely a declaration
            return targetRange.start.line === position.line;
        }
        catch {
            // If LSP fails, heuristic: check for type names or 'var', 'final', 'const'
            const line = document.lineAt(position.line).text.trim();
            return /\b(var|final|const|late|String|int|double|bool|List|Map|Set|var)\b/.test(line) && line.includes('=');
        }
    }
}
exports.DartPlacementStrategy = DartPlacementStrategy;
//# sourceMappingURL=dartStrategy.js.map