import * as vscode from 'vscode';
import { JSPlacementStrategy, PlacementResult } from './strategies/jsStrategy';
import { DartPlacementStrategy } from './strategies/dartStrategy';

export class LogPlacementEngine {
    private jsStrategy: JSPlacementStrategy;
    private dartStrategy: DartPlacementStrategy;

    constructor() {
        this.jsStrategy = new JSPlacementStrategy();
        this.dartStrategy = new DartPlacementStrategy();
    }

    public async getPlacement(document: vscode.TextDocument, selection: vscode.Selection, variableName: string): Promise<PlacementResult> {
        const isDart = document.languageId === 'dart';
        
        if (isDart) {
            return this.dartStrategy.calculate(document, selection, variableName);
        } else {
            // Assume JS/TS for other cases (or we could check for specific IDs)
            return this.jsStrategy.calculate(document, selection, variableName);
        }
    }
}
