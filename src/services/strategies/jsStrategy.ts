import * as vscode from 'vscode';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export interface PlacementResult {
    type: 'insert' | 'replace';
    position?: vscode.Position;
    range?: vscode.Range;
    text: string;
    indentation: number;
}

export class JSPlacementStrategy {
    public async calculate(document: vscode.TextDocument, selection: vscode.Selection, variableName: string): Promise<PlacementResult> {
        const code = document.getText();
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties'],
            errorRecovery: true
        });

        let targetNode: any = null;
        const offset = document.offsetAt(selection.active);

        // 1. Find the deepest node at the selection
        traverse(ast, {
            enter(path: any) {
                if (path.node.start! <= offset && path.node.end! >= offset) {
                    if (!targetNode || (path.node.end! - path.node.start! < targetNode.end - targetNode.start)) {
                        targetNode = path.node;
                    }
                }
            }
        });

        if (!targetNode) {
            // Fallback to simple line-based logic if AST fails
            return this.getFallbackResult(document, selection, variableName);
        }

        // 2. Scenario B: Implicit Arrow Function refactor
        const arrowParent = this.findParentArrow(ast, offset);
        if (arrowParent && arrowParent.expression) {
            return this.handleImplicitArrow(document, arrowParent, variableName);
        }

        // 3. Scenario C: Function Name Selection
        const funcNode = this.findFunctionAtSelection(ast, offset);
        if (funcNode) {
            return this.handleFunctionEntry(document, funcNode, variableName);
        }

        // 4. Scenario A & Return Statement logic
        return this.handleStandardPlacement(document, targetNode, selection, variableName);
    }

    private findParentArrow(ast: any, offset: number): t.ArrowFunctionExpression | null {
        let arrow: t.ArrowFunctionExpression | null = null;
        traverse(ast, {
            ArrowFunctionExpression(path: any) {
                if (path.node.start! <= offset && path.node.end! >= offset) {
                    if (path.node.expression) {
                        arrow = path.node;
                    }
                }
            }
        });
        return arrow;
    }

    private findFunctionAtSelection(ast: any, offset: number): any | null {
        let func: any = null;
        traverse(ast, {
            "FunctionDeclaration|ClassMethod|FunctionExpression"(path: any) {
                const node = path.node;
                // If the selection is on the identifier (name) of the function
                if (node.id && node.id.start <= offset && node.id.end >= offset) {
                    func = node;
                } else if (node.key && node.key.start <= offset && node.key.end >= offset) {
                    func = node;
                }
            },
            VariableDeclarator(path: any) {
                const node = path.node;
                // Handle const fn = () => {}
                if (node.id.start! <= offset && node.id.end! >= offset) {
                    if (t.isArrowFunctionExpression(node.init) || t.isFunctionExpression(node.init)) {
                        func = path.parent; // We want the VariableDeclaration
                    }
                }
            }
        });
        return func;
    }

    private handleImplicitArrow(document: vscode.TextDocument, node: t.ArrowFunctionExpression, variableName: string): PlacementResult {
        const body = node.body as t.Expression;
        const bodyRange = new vscode.Range(
            document.positionAt(body.start!),
            document.positionAt(body.end!)
        );
        const bodyText = document.getText(bodyRange);
        
        const indent = document.lineAt(document.positionAt(node.start!)).firstNonWhitespaceCharacterIndex;
        const padding = ' '.repeat(indent);
        const innerPadding = ' '.repeat(indent + 2);

        const isAsync = node.async;
        const asyncPrefix = isAsync ? 'async ' : '';
        
        // Construct the replacement text
        // Example: (v) => { console.log(v); return v.id; }
        const replacementText = ` {
${innerPadding}console.log("🚀 ~ ${variableName}:", ${variableName});
${innerPadding}return ${bodyText};
${padding}}`;

        return {
            type: 'replace',
            range: bodyRange,
            text: replacementText,
            indentation: indent + 2
        };
    }

    private handleFunctionEntry(document: vscode.TextDocument, node: any, variableName: string): PlacementResult {
        // Placement B: After the entire definition
        const endPos = document.positionAt(node.end!);
        const targetLine = endPos.line + 1;
        const indent = document.lineAt(document.positionAt(node.start!)).firstNonWhitespaceCharacterIndex;
        
        return {
            type: 'insert',
            position: new vscode.Position(targetLine, 0),
            text: `console.log("🚀 ~ ${variableName}:", ${variableName});`,
            indentation: indent
        };
    }

    private handleStandardPlacement(document: vscode.TextDocument, node: any, selection: vscode.Selection, variableName: string): PlacementResult {
        const line = document.lineAt(selection.active.line);
        const isReturn = line.text.trim().startsWith('return');
        const indent = line.firstNonWhitespaceCharacterIndex;

        if (isReturn) {
            return {
                type: 'insert',
                position: new vscode.Position(selection.active.line, 0),
                text: `console.log("🚀 ~ ${variableName}:", ${variableName});`,
                indentation: indent
            };
        }

        // Default: next line
        return {
            type: 'insert',
            position: new vscode.Position(selection.active.line + 1, 0),
            text: `console.log("🚀 ~ ${variableName}:", ${variableName});`,
            indentation: indent
        };
    }

    private getFallbackResult(document: vscode.TextDocument, selection: vscode.Selection, variableName: string): PlacementResult {
        const line = selection.active.line;
        const indent = document.lineAt(line).firstNonWhitespaceCharacterIndex;
        return {
            type: 'insert',
            position: new vscode.Position(line + 1, 0),
            text: `console.log("🚀 ~ ${variableName}:", ${variableName});`,
            indentation: indent
        };
    }
}
