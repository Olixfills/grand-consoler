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
exports.InsertionService = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class InsertionService {
    async insertLog() {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const document = editor.document;
        const selection = editor.selection;
        const position = selection.active;
        const fileName = path.basename(document.fileName);
        const line = position.line + 1;
        const isDart = document.languageId === 'dart';
        // 1. Get Variable Name
        let variableName = document.getText(selection);
        if (!variableName) {
            const range = document.getWordRangeAtPosition(position);
            variableName = range ? document.getText(range) : 'VALUE';
        }
        // 2. Get Function Name
        const functionName = await this.getFunctionName(document, position);
        // 3. Construct Log
        const logLines = isDart
            ? this.getDartLog(fileName, line, functionName, variableName)
            : this.getJsLog(fileName, line, functionName, variableName);
        // 4. Insert
        await editor.edit(editBuilder => {
            const indent = editor.document.lineAt(position.line).firstNonWhitespaceCharacterIndex;
            const padding = ' '.repeat(indent);
            const insertText = '\n' + logLines.map(l => padding + l).join('\n') + '\n';
            editBuilder.insert(new vscode.Position(position.line + 1, 0), insertText);
        });
    }
    async getFunctionName(document, position) {
        try {
            const symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
            if (!symbols)
                return 'anonymous';
            const findSymbol = (symbols) => {
                for (const symbol of symbols) {
                    if (symbol.range.contains(position)) {
                        const child = findSymbol(symbol.children);
                        return child || symbol.name;
                    }
                }
                return undefined;
            };
            return findSymbol(symbols) || 'global';
        }
        catch {
            return 'unknown';
        }
    }
    getJsLog(fileName, line, func, variable) {
        return [
            `console.log("====================================");`,
            `console.log("🚀 ~ ${fileName}:${line} ~ ${func} ~ ${variable}:", ${variable});`,
            `console.log("====================================");`
        ];
    }
    getDartLog(fileName, line, func, variable) {
        return [
            `debugPrint("====================================");`,
            `debugPrint("🚀 ~ ${fileName}:${line} ~ ${func} ~ ${variable}: \$${variable}");`,
            `debugPrint("====================================");`
        ];
    }
}
exports.InsertionService = InsertionService;
//# sourceMappingURL=insertionService.js.map