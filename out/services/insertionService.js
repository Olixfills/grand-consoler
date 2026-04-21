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
const logPlacementEngine_1 = require("./logPlacementEngine");
class InsertionService {
    placementEngine;
    constructor() {
        this.placementEngine = new logPlacementEngine_1.LogPlacementEngine();
    }
    async insertLog() {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const document = editor.document;
        const selection = editor.selection;
        const position = selection.active;
        const fileName = path.basename(document.fileName);
        // 1. Get Variable Name
        let variableName = document.getText(selection);
        if (!variableName) {
            const range = document.getWordRangeAtPosition(position);
            variableName = range ? document.getText(range) : 'VALUE';
        }
        // 2. Get Placement from Engine
        const placement = await this.placementEngine.getPlacement(document, selection, variableName);
        // 3. Apply Edit
        await editor.edit(editBuilder => {
            const padding = ' '.repeat(placement.indentation);
            const isDart = document.languageId === 'dart';
            // Format the log line(s)
            const logContent = this.formatLog(placement.text, padding, isDart);
            if (placement.type === 'insert' && placement.position) {
                editBuilder.insert(placement.position, logContent);
            }
            else if (placement.type === 'replace' && placement.range) {
                editBuilder.replace(placement.range, placement.text);
            }
        });
    }
    formatLog(text, padding, isDart) {
        // If it's a multi-line replacement (like arrow function), we already have the text
        if (text.includes('\n'))
            return text;
        // Otherwise, wrap in standard premium formatting
        const lines = [
            `console.log("====================================");`, // This will be adjusted below
            text,
            `console.log("====================================");`
        ];
        // For simplicity and "Smart" feel, we might just use the single line if it's a dense refactor
        // but for standard insertions, we keep the signature look.
        // Actually, let's keep it consistent with the user's previous preference but clean:
        const logLines = isDart
            ? [
                `${padding}debugPrint("====================================");`,
                `${padding}${text}`,
                `${padding}debugPrint("====================================");`
            ]
            : [
                `${padding}console.log("====================================");`,
                `${padding}${text}`,
                `${padding}console.log("====================================");`
            ];
        return '\n' + logLines.join('\n') + '\n';
    }
}
exports.InsertionService = InsertionService;
//# sourceMappingURL=insertionService.js.map