import * as vscode from 'vscode';
import * as path from 'path';

export class InsertionService {
    public async insertLog() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

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
        const targetLine = this.findSafeInsertionLine(document, position);

        await editor.edit(editBuilder => {
            // Use the indentation of the target line (matching the block we are inserting into)
            // or the original line if targetLine is same as default
            const indentTarget = targetLine > position.line ? Math.max(0, targetLine - 1) : position.line;
            const indent = editor.document.lineAt(indentTarget).firstNonWhitespaceCharacterIndex;
            const padding = ' '.repeat(indent);
            const insertText = '\n' + logLines.map(l => padding + l).join('\n') + '\n';
            editBuilder.insert(new vscode.Position(targetLine, 0), insertText);
        });
    }

    private findSafeInsertionLine(document: vscode.TextDocument, position: vscode.Position): number {
        const startLine = position.line;
        let currentLine = document.lineAt(startLine);
        let text = currentLine.text.trim();

        // Rule 1: Block Awareness
        // If current line ends with a block opener, insert on next line
        if (text.endsWith('{') || text.endsWith('(') || text.endsWith('[') || text.endsWith('=>')) {
            return startLine + 1;
        }

        // Rule 2 & 3: Chain Detection & Forward Scanning
        let scanLine = startLine + 1;
        const maxScan = Math.min(startLine + 50, document.lineCount); // 50 lines scan limit

        while (scanLine < maxScan) {
            const line = document.lineAt(scanLine);
            const lineText = line.text.trim();

            if (line.isEmptyOrWhitespace) {
                scanLine++;
                continue;
            }

            // If the next meaningful line starts with a chain operator
            if (lineText.startsWith('.') || lineText.startsWith('..')) {
                // If this line opens a block, we stop here and log INSIDE the block
                if (lineText.endsWith('{') || lineText.endsWith('=>')) {
                    return scanLine + 1;
                }
                scanLine++;
                continue;
            }

            // If we found a line that doesn't start with a chain operator, 
            // the previous line was the end of the chain.
            return scanLine;
        }

        return startLine + 1;
    }

    private async getFunctionName(document: vscode.TextDocument, position: vscode.Position): Promise<string> {
        try {
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            if (!symbols) return 'anonymous';

            const findSymbol = (symbols: vscode.DocumentSymbol[]): string | undefined => {
                for (const symbol of symbols) {
                    if (symbol.range.contains(position)) {
                        const child = findSymbol(symbol.children);
                        return child || symbol.name;
                    }
                }
                return undefined;
            };

            return findSymbol(symbols) || 'global';
        } catch {
            return 'unknown';
        }
    }

    private getJsLog(fileName: string, line: number, func: string, variable: string): string[] {
        return [
            `console.log("====================================");`,
            `console.log("🚀 ~ ${fileName}:${line} ~ ${func} ~ ${variable}:", ${variable});`,
            `console.log("====================================");`
        ];
    }

    private getDartLog(fileName: string, line: number, func: string, variable: string): string[] {
        return [
            `debugPrint("====================================");`,
            `debugPrint("🚀 ~ ${fileName}:${line} ~ ${func} ~ ${variable}: \$${variable}");`,
            `debugPrint("====================================");`
        ];
    }
}
