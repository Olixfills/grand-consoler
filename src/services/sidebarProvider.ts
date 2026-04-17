import * as vscode from 'vscode';
import { ScannerService, LogStatement } from './scannerService';

export class GrandConsolerSidebarProvider implements vscode.TreeDataProvider<LogItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<LogItem | undefined | void> = new vscode.EventEmitter<LogItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<LogItem | undefined | void> = this._onDidChangeTreeData.event;

    private scanner: ScannerService;

    constructor() {
        this.scanner = new ScannerService();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: LogItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: LogItem): Promise<LogItem[]> {
        if (!element) {
            const logs = await this.scanner.findLogsInWorkspace();
            // Group by file
            const files = [...new Set(logs.map(l => l.uri.fsPath))];
            return files.map(f => new LogItem(
                vscode.Uri.file(f).fsPath.split('/').pop() || f,
                vscode.TreeItemCollapsibleState.Collapsed,
                logs.filter(l => l.uri.fsPath === f)
            ));
        } else {
            return element.statements.map(s => {
                const item = new LogItem(
                    `Line ${s.line + 1}: ${s.text.substring(0, 30)}...`,
                    vscode.TreeItemCollapsibleState.None,
                    [s],
                    s
                );
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

export class LogItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly statements: LogStatement[],
        public readonly statement?: LogStatement
    ) {
        super(label, collapsibleState);
        this.tooltip = statement ? statement.text : label;
    }
}
