import * as vscode from 'vscode';
import * as path from 'path';
import { LogPlacementEngine } from './logPlacementEngine';

export class InsertionService {
    private placementEngine: LogPlacementEngine;

    constructor() {
        this.placementEngine = new LogPlacementEngine();
    }

    public async insertLog() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const selection = editor.selection;
        const position = selection.active;
        const fileName = path.basename(document.fileName);

        // 1. Get Variable Name
        let variableName = document.getText(selection);
        if (!variableName) {
            const range = document.getWordRangeAtPosition(position);
            variableName = range ? document.getText(range) : 'VALUE';
        }

        // 2. Get Placement from Engine
        const placement = await this.placementEngine.getPlacement(document, selection, variableName);

        // 3. Apply Edit
        await editor.edit(editBuilder => {
            const padding = ' '.repeat(placement.indentation);
            const isDart = document.languageId === 'dart';
            
            // Format the log line(s)
            const logContent = this.formatLog(placement.text, padding, isDart);

            if (placement.type === 'insert' && placement.position) {
                editBuilder.insert(placement.position, logContent);
            } else if (placement.type === 'replace' && placement.range) {
                editBuilder.replace(placement.range, placement.text);
            }
        });
    }

    private formatLog(text: string, padding: string, isDart: boolean): string {
        // If it's a multi-line replacement (like arrow function), we already have the text
        if (text.includes('\n')) return text;

        // Otherwise, wrap in standard premium formatting
        const lines = [
            `console.log("====================================");`, // This will be adjusted below
            text,
            `console.log("====================================");`
        ];

        // For simplicity and "Smart" feel, we might just use the single line if it's a dense refactor
        // but for standard insertions, we keep the signature look.
        
        // Actually, let's keep it consistent with the user's previous preference but clean:
        const logLines = isDart 
            ? [
                `${padding}debugPrint("====================================");`,
                `${padding}${text}`,
                `${padding}debugPrint("====================================");`
              ]
            : [
                `${padding}console.log("====================================");`,
                `${padding}${text}`,
                `${padding}console.log("====================================");`
              ];

        return '\n' + logLines.join('\n') + '\n';
    }
}
