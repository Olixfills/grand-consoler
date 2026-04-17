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
        await editor.edit(editBuilder => {
            const indent = editor.document.lineAt(position.line).firstNonWhitespaceCharacterIndex;
            const padding = ' '.repeat(indent);
            const insertText = '\n' + logLines.map(l => padding + l).join('\n') + '\n';
            editBuilder.insert(new vscode.Position(position.line + 1, 0), insertText);
        });
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
