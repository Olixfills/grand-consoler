import * as vscode from 'vscode';

export interface LogStatement {
    uri: vscode.Uri;
    line: number;
    text: string;
    isCommented: boolean;
    language: string;
}

export class ScannerService {
    private static readonly JS_RE = /console\.log\s*\(/g;
    private static readonly DART_RE = /(?:debugPrint|print|log)\s*\(/g;

    public async findLogsInWorkspace(): Promise<LogStatement[]> {
        const files = await vscode.workspace.findFiles(
            '**/*.{js,ts,jsx,tsx,dart}',
            '**/node_modules/**'
        );

        let allLogs: LogStatement[] = [];
        for (const file of files) {
            const logs = await this.findLogsInFile(file);
            allLogs = allLogs.concat(logs);
        }
        return allLogs;
    }

    public async findLogsInFile(uri: vscode.Uri): Promise<LogStatement[]> {
        const document = await vscode.workspace.openTextDocument(uri);
        const text = document.getText();
        const lines = text.split('\n');
        const logs: LogStatement[] = [];
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
