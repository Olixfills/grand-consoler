import * as vscode from 'vscode';
import { InsertionService } from './services/insertionService';
import { ScannerService } from './services/scannerService';
import { GrandConsolerSidebarProvider } from './services/sidebarProvider';
import { DecorationService } from './services/decorationService';

export function activate(context: vscode.ExtensionContext) {
    const insertionService = new InsertionService();
    const scannerService = new ScannerService();
    const decorationService = new DecorationService();
    const sidebarProvider = new GrandConsolerSidebarProvider();

    // Register Sidebar
    vscode.window.registerTreeDataProvider('grand-consoler-list', sidebarProvider);

    // Register Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('grand-consoler.insertLog', () => {
            insertionService.insertLog();
            sidebarProvider.refresh();
        }),

        vscode.commands.registerCommand('grand-consoler.refresh', () => {
            sidebarProvider.refresh();
        }),

        vscode.commands.registerCommand('grand-consoler.commentAll', async () => {
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
        }),

        vscode.commands.registerCommand('grand-consoler.uncommentAll', async () => {
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
        }),

        vscode.commands.registerCommand('grand-consoler.deleteLog', async (item: any) => {
            const statement = item.statement;
            if (!statement) return;

            const edit = new vscode.WorkspaceEdit();
            edit.delete(statement.uri, new vscode.Range(statement.line, 0, statement.line + 1, 0));
            
            await vscode.workspace.applyEdit(edit);
            sidebarProvider.refresh();
            
            const message = await vscode.window.showInformationMessage('Log deleted.', 'Undo');
            if (message === 'Undo') {
                await vscode.commands.executeCommand('undo');
                sidebarProvider.refresh();
            }
        }),

        vscode.commands.registerCommand('grand-consoler.toggleComment', async (item: any) => {
            const statement = item.statement;
            if (!statement) return;

            const document = await vscode.workspace.openTextDocument(statement.uri);
            const line = document.lineAt(statement.line);
            const edit = new vscode.WorkspaceEdit();

            if (statement.isCommented) {
                const commentIndex = line.text.indexOf('// ');
                if (commentIndex !== -1) {
                    edit.delete(statement.uri, new vscode.Range(statement.line, commentIndex, statement.line, commentIndex + 3));
                }
            } else {
                const insertionPos = line.firstNonWhitespaceCharacterIndex;
                edit.insert(statement.uri, new vscode.Position(statement.line, insertionPos), '// ');
            }

            await vscode.workspace.applyEdit(edit);
            sidebarProvider.refresh();
        }),

        vscode.commands.registerCommand('grand-consoler.deleteAll', async () => {
            const result = await vscode.window.showWarningMessage(
                'Are you sure you want to delete ALL console logs in the workspace?',
                { modal: true },
                'Yes'
            );

            if (result === 'Yes') {
                const logs = await scannerService.findLogsInWorkspace();
                const edit = new vscode.WorkspaceEdit();
                
                // Group by URI and delete lines in reverse order to maintain indices
                const logsByUri = new Map<string, number[]>();
                logs.forEach(l => {
                    const uriStr = l.uri.toString();
                    if (!logsByUri.has(uriStr)) logsByUri.set(uriStr, []);
                    logsByUri.get(uriStr)!.push(l.line);
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
        })
    );

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

export function deactivate() {}
