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
exports.DecorationService = void 0;
const vscode = __importStar(require("vscode"));
const scannerService_1 = require("./scannerService");
class DecorationService {
    decorationType;
    scanner;
    constructor() {
        this.scanner = new scannerService_1.ScannerService();
        this.decorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.parse('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZmlsbD0iI2Y1YTcwMCIgZD0iTTEyIDhsLTggNHYtOHoiLz48L3N2Zz4='),
            gutterIconSize: 'contain'
        });
    }
    async updateDecorations(editor) {
        if (!editor)
            return;
        const logs = await this.scanner.findLogsInFile(editor.document.uri);
        const decorations = logs.map(log => ({
            range: new vscode.Range(log.line, 0, log.line, 0),
            hoverMessage: 'Grand Consoler: Active Log'
        }));
        editor.setDecorations(this.decorationType, decorations);
    }
}
exports.DecorationService = DecorationService;
//# sourceMappingURL=decorationService.js.map