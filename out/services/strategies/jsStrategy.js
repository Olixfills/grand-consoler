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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSPlacementStrategy = void 0;
const vscode = __importStar(require("vscode"));
const parser = __importStar(require("@babel/parser"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const t = __importStar(require("@babel/types"));
class JSPlacementStrategy {
    async calculate(document, selection, variableName) {
        const code = document.getText();
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties'],
            errorRecovery: true
        });
        let targetNode = null;
        const offset = document.offsetAt(selection.active);
        // 1. Find the deepest node at the selection
        (0, traverse_1.default)(ast, {
            enter(path) {
                if (path.node.start <= offset && path.node.end >= offset) {
                    if (!targetNode || (path.node.end - path.node.start < targetNode.end - targetNode.start)) {
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
    findParentArrow(ast, offset) {
        let arrow = null;
        (0, traverse_1.default)(ast, {
            ArrowFunctionExpression(path) {
                if (path.node.start <= offset && path.node.end >= offset) {
                    if (path.node.expression) {
                        arrow = path.node;
                    }
                }
            }
        });
        return arrow;
    }
    findFunctionAtSelection(ast, offset) {
        let func = null;
        (0, traverse_1.default)(ast, {
            "FunctionDeclaration|ClassMethod|FunctionExpression"(path) {
                const node = path.node;
                // If the selection is on the identifier (name) of the function
                if (node.id && node.id.start <= offset && node.id.end >= offset) {
                    func = node;
                }
                else if (node.key && node.key.start <= offset && node.key.end >= offset) {
                    func = node;
                }
            },
            VariableDeclarator(path) {
                const node = path.node;
                // Handle const fn = () => {}
                if (node.id.start <= offset && node.id.end >= offset) {
                    if (t.isArrowFunctionExpression(node.init) || t.isFunctionExpression(node.init)) {
                        func = path.parent; // We want the VariableDeclaration
                    }
                }
            }
        });
        return func;
    }
    handleImplicitArrow(document, node, variableName) {
        const body = node.body;
        const bodyRange = new vscode.Range(document.positionAt(body.start), document.positionAt(body.end));
        const bodyText = document.getText(bodyRange);
        const indent = document.lineAt(document.positionAt(node.start)).firstNonWhitespaceCharacterIndex;
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
    handleFunctionEntry(document, node, variableName) {
        // Placement B: After the entire definition
        const endPos = document.positionAt(node.end);
        const targetLine = endPos.line + 1;
        const indent = document.lineAt(document.positionAt(node.start)).firstNonWhitespaceCharacterIndex;
        return {
            type: 'insert',
            position: new vscode.Position(targetLine, 0),
            text: `console.log("🚀 ~ ${variableName}:", ${variableName});`,
            indentation: indent
        };
    }
    handleStandardPlacement(document, node, selection, variableName) {
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
    getFallbackResult(document, selection, variableName) {
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
exports.JSPlacementStrategy = JSPlacementStrategy;
//# sourceMappingURL=jsStrategy.js.map