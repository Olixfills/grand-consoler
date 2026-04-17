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
exports.ScannerService = void 0;
const vscode = __importStar(require("vscode"));
class ScannerService {
    static JS_RE = /console\.log\s*\(/g;
    static DART_RE = /(?:debugPrint|print|log)\s*\(/g;
    async findLogsInWorkspace() {
        const files = await vscode.workspace.findFiles('**/*.{js,ts,jsx,tsx,dart}', '**/node_modules/**');
        let allLogs = [];
        for (const file of files) {
            const logs = await this.findLogsInFile(file);
            allLogs = allLogs.concat(logs);
        }
        return allLogs;
    }
    async findLogsInFile(uri) {
        const document = await vscode.workspace.openTextDocument(uri);
        const text = document.getText();
        const lines = text.split('\n');
        const logs = [];
        const isDart = uri.fsPath.endsWith('.dart');
        const regex = isDart ? ScannerService.DART_RE : ScannerService.JS_RE;
        lines.forEach((lineText, i) => {
            regex.lastIndex = 0;
            if (regex.test(lineText)) {
                // Check if commented
                const trimmed = lineText.trim();
                const isCommented = trimmed.startsWith('//') || trimmed.startsWith('/*');
                logs.push({
                    uri,
                    line: i,
                    text: trimmed,
                    isCommented,
                    language: isDart ? 'dart' : 'javascript'
                });
            }
        });
        return logs;
    }
}
exports.ScannerService = ScannerService;
//# sourceMappingURL=scannerService.js.map