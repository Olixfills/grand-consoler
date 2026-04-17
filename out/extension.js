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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const insertionService_1 = require("./services/insertionService");
const scannerService_1 = require("./services/scannerService");
const sidebarProvider_1 = require("./services/sidebarProvider");
const decorationService_1 = require("./services/decorationService");
function activate(context) {
    const insertionService = new insertionService_1.InsertionService();
    const scannerService = new scannerService_1.ScannerService();
    const decorationService = new decorationService_1.DecorationService();
    const sidebarProvider = new sidebarProvider_1.GrandConsolerSidebarProvider();
    // Register Sidebar
    vscode.window.registerTreeDataProvider('grand-consoler-list', sidebarProvider);
    // Register Commands
    context.subscriptions.push(vscode.commands.registerCommand('grand-consoler.insertLog', () => {
        insertionService.insertLog();
        sidebarProvider.refresh();
    }), vscode.commands.registerCommand('grand-consoler.refresh', () => {
        sidebarProvider.refresh();
    }), vscode.commands.registerCommand('grand-consoler.commentAll', async () => {
        const logs = await scannerService.findLogsInWorkspace();
        const edit = new vscode.WorkspaceEdit();
        for (const log of logs) {
            if (!log.isCommented) {
                const document = await vscode.workspace.openTextDocument(log.uri);
                const line = document.lineAt(log.line);
                const insertionPos = line.firstNonWhitespaceCharacterIndex;
                edit.insert(log.uri, new vscode.Position(log.line, insertionPos), '// ');
            }
        }
        await vscode.workspace.applyEdit(edit);
        sidebarProvider.refresh();
        vscode.window.showInformationMessage('All logs commented out!');
    }), vscode.commands.registerCommand('grand-consoler.uncommentAll', async () => {
        const logs = await scannerService.findLogsInWorkspace();
        const edit = new vscode.WorkspaceEdit();
        for (const log of logs) {
            if (log.isCommented) {
                const document = await vscode.workspace.openTextDocument(log.uri);
                const line = document.lineAt(log.line);
                const commentIndex = line.text.indexOf('// ');
                if (commentIndex !== -1) {
                    edit.delete(log.uri, new vscode.Range(log.line, commentIndex, log.line, commentIndex + 3));
                }
            }
        }
        await vscode.workspace.applyEdit(edit);
        sidebarProvider.refresh();
        vscode.window.showInformationMessage('All logs uncommented!');
    }), vscode.commands.registerCommand('grand-consoler.deleteLog', async (item) => {
        const statement = item.statement;
        if (!statement)
            return;
        const edit = new vscode.WorkspaceEdit();
        edit.delete(statement.uri, new vscode.Range(statement.line, 0, statement.line + 1, 0));
        await vscode.workspace.applyEdit(edit);
        sidebarProvider.refresh();
        const message = await vscode.window.showInformationMessage('Log deleted.', 'Undo');
        if (message === 'Undo') {
            await vscode.commands.executeCommand('undo');
            sidebarProvider.refresh();
        }
    }), vscode.commands.registerCommand('grand-consoler.toggleComment', async (item) => {
        const statement = item.statement;
        if (!statement)
            return;
        const document = await vscode.workspace.openTextDocument(statement.uri);
        const line = document.lineAt(statement.line);
        const edit = new vscode.WorkspaceEdit();
        if (statement.isCommented) {
            const commentIndex = line.text.indexOf('// ');
            if (commentIndex !== -1) {
                edit.delete(statement.uri, new vscode.Range(statement.line, commentIndex, statement.line, commentIndex + 3));
            }
        }
        else {
            const insertionPos = line.firstNonWhitespaceCharacterIndex;
            edit.insert(statement.uri, new vscode.Position(statement.line, insertionPos), '// ');
        }
        await vscode.workspace.applyEdit(edit);
        sidebarProvider.refresh();
    }), vscode.commands.registerCommand('grand-consoler.deleteAll', async () => {
        const result = await vscode.window.showWarningMessage('Are you sure you want to delete ALL console logs in the workspace?', { modal: true }, 'Yes');
        if (result === 'Yes') {
            const logs = await scannerService.findLogsInWorkspace();
            const edit = new vscode.WorkspaceEdit();
            // Group by URI and delete lines in reverse order to maintain indices
            const logsByUri = new Map();
            logs.forEach(l => {
                const uriStr = l.uri.toString();
                if (!logsByUri.has(uriStr))
                    logsByUri.set(uriStr, []);
                logsByUri.get(uriStr).push(l.line);
            });
            for (const [uriStr, lines] of logsByUri.entries()) {
                const uri = vscode.Uri.parse(uriStr);
                lines.sort((a, b) => b - a).forEach(line => {
                    edit.delete(uri, new vscode.Range(line, 0, line + 1, 0));
                });
            }
            await vscode.workspace.applyEdit(edit);
            sidebarProvider.refresh();
            vscode.window.showInformationMessage('All logs deleted!');
        }
    }));
    // Update decorations on switch or open
    vscode.window.onDidChangeActiveTextEditor(editor => {
        decorationService.updateDecorations(editor);
    }, null, context.subscriptions);
    vscode.workspace.onDidSaveTextDocument(doc => {
        decorationService.updateDecorations(vscode.window.activeTextEditor);
        sidebarProvider.refresh();
    }, null, context.subscriptions);
    // Initial check
    decorationService.updateDecorations(vscode.window.activeTextEditor);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map