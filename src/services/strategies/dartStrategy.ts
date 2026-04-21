import * as vscode from 'vscode';

export interface PlacementResult {
    type: 'insert' | 'replace';
    position?: vscode.Position;
    range?: vscode.Range;
    text: string;
    indentation: number;
}

export class DartPlacementStrategy {
    public async calculate(document: vscode.TextDocument, selection: vscode.Selection, variableName: string): Promise<PlacementResult> {
        const line = document.lineAt(selection.active.line);
        const lineText = line.text;
        const indent = line.firstNonWhitespaceCharacterIndex;

        // 1. Is it a return statement?
        if (lineText.trim().startsWith('return')) {
            return {
                type: 'insert',
                position: new vscode.Position(selection.active.line, 0),
                text: `debugPrint("🚀 ~ ${variableName}: \$${variableName}");`,
                indentation: indent
            };
        }

        // 2. Is it a declaration? (Use Definition Provider)
        const isDeclaration = await this.checkIfDeclaration(document, selection.active);

        if (isDeclaration) {
            // Log after the declaration line
            return {
                type: 'insert',
                position: new vscode.Position(selection.active.line + 1, 0),
                text: `debugPrint("🚀 ~ ${variableName}: \$${variableName}");`,
                indentation: indent
            };
        }

        // 3. Stay in local scope (check if we are at the end of a block)
        const nextLineIndex = selection.active.line + 1;
        if (nextLineIndex < document.lineCount) {
            const nextLine = document.lineAt(nextLineIndex);
            if (nextLine.text.trim() === '}') {
                // If next line is closing brace, we definitely want to stay above it
                return {
                    type: 'insert',
                    position: new vscode.Position(selection.active.line + 1, 0),
                    text: `debugPrint("🚀 ~ ${variableName}: \$${variableName}");`,
                    indentation: indent
                };
            }
        }

        // Default: next line insertion
        return {
            type: 'insert',
            position: new vscode.Position(selection.active.line + 1, 0),
            text: `debugPrint("🚀 ~ ${variableName}: \$${variableName}");`,
            indentation: indent
        };
    }

    private async checkIfDeclaration(document: vscode.TextDocument, position: vscode.Position): Promise<boolean> {
        try {
            const locations = await vscode.commands.executeCommand<(vscode.Location | vscode.LocationLink)[]>(
                'vscode.executeDefinitionProvider',
                document.uri,
                position
            );

            if (!locations || locations.length === 0) return false;

            const target = locations[0];
            const targetRange = 'range' in target ? target.range : target.targetRange!;
            
            // If the definition is on the same line as the cursor, it's likely a declaration
            return targetRange.start.line === position.line;
        } catch {
            // If LSP fails, heuristic: check for type names or 'var', 'final', 'const'
            const line = document.lineAt(position.line).text.trim();
            return /\b(var|final|const|late|String|int|double|bool|List|Map|Set|var)\b/.test(line) && line.includes('=');
        }
    }
}
