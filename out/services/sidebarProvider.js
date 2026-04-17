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
exports.LogItem = exports.GrandConsolerSidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const scannerService_1 = require("./scannerService");
class GrandConsolerSidebarProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    scanner;
    constructor() {
        this.scanner = new scannerService_1.ScannerService();
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!element) {
            const logs = await this.scanner.findLogsInWorkspace();
            // Group by file
            const files = [...new Set(logs.map(l => l.uri.fsPath))];
            return files.map(f => new LogItem(vscode.Uri.file(f).fsPath.split('/').pop() || f, vscode.TreeItemCollapsibleState.Collapsed, logs.filter(l => l.uri.fsPath === f)));
        }
        else {
            return element.statements.map(s => {
                const item = new LogItem(`Line ${s.line + 1}: ${s.text.substring(0, 30)}...`, vscode.TreeItemCollapsibleState.None, [s], s);
                item.command = {
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [s.uri, { selection: new vscode.Range(s.line, 0, s.line, 0) }]
                };
                item.contextValue = 'logStatement';
                item.iconPath = s.isCommented ? new vscode.ThemeIcon('comment-discussion') : new vscode.ThemeIcon('circle-outline');
                return item;
            });
        }
    }
}
exports.GrandConsolerSidebarProvider = GrandConsolerSidebarProvider;
class LogItem extends vscode.TreeItem {
    label;
    collapsibleState;
    statements;
    statement;
    constructor(label, collapsibleState, statements, statement) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.statements = statements;
        this.statement = statement;
        this.tooltip = statement ? statement.text : label;
    }
}
exports.LogItem = LogItem;
//# sourceMappingURL=sidebarProvider.js.map