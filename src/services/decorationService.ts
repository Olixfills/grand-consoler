import * as vscode from 'vscode';
import { ScannerService } from './scannerService';

export class DecorationService {
    private decorationType: vscode.TextEditorDecorationType;
    private scanner: ScannerService;

    constructor() {
        this.scanner = new ScannerService();
        this.decorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.parse('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZmlsbD0iI2Y1YTcwMCIgZD0iTTEyIDhsLTggNHYtOHoiLz48L3N2Zz4='),
            gutterIconSize: 'contain'
        });
    }

    public async updateDecorations(editor?: vscode.TextEditor) {
        if (!editor) return;

        const logs = await this.scanner.findLogsInFile(editor.document.uri);
        const decorations: vscode.DecorationOptions[] = logs.map(log => ({
            range: new vscode.Range(log.line, 0, log.line, 0),
            hoverMessage: 'Grand Consoler: Active Log'
        }));

        editor.setDecorations(this.decorationType, decorations);
    }
}
