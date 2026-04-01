// src/extension.ts
import * as vscode from 'vscode';
import {generateCode} from 'statelang-language';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    // Command registrieren
    const disposable = vscode.commands.registerCommand('statelang.generate', async (uri: vscode.Uri) => {
        if (!uri) {
            vscode.window.showErrorMessage('No file selected');
            return;
        }

        const filePath = uri.fsPath;
        // Hier müsste dein Code zum Parsen der DSL stehen
        const model = {}; // Platzhalter: Model aus der Datei erzeugen
        const outDir = vscode.Uri.joinPath(uri, '../out').fsPath;

        // Sicherstellen, dass der Ordner existiert
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        // generateCode aufrufen
        generateCode(model as any, filePath, outDir);
        vscode.window.showInformationMessage(`Java code generated in ${outDir}`);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
