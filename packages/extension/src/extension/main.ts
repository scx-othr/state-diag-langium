import type { LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node.js';
import * as vscode from 'vscode';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as zlib from 'node:zlib';
import * as https from 'node:https';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node.js';
import { URI } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { createStatelangServices, generatePlantUML, generateCode } from 'statelang-language';
import type { Model } from 'statelang-language';

let client: LanguageClient;
let plantUmlPanel: vscode.WebviewPanel | undefined;

// ── PlantUML encoding (deflate + custom base64, no external dep) ─────────────

const PUML_ALPHABET =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

function encode6(b: number): string {
    return PUML_ALPHABET[b & 0x3f];
}

function encode3bytes(b1: number, b2: number, b3: number): string {
    return (
        encode6(b1 >> 2) +
        encode6(((b1 & 0x3) << 4) | (b2 >> 4)) +
        encode6(((b2 & 0xf) << 2) | (b3 >> 6)) +
        encode6(b3)
    );
}

function encodePlantUML(puml: string): string {
    const compressed = zlib.deflateRawSync(Buffer.from(puml, 'utf8'), { level: 9 });
    let result = '';
    for (let i = 0; i < compressed.length; i += 3) {
        result += encode3bytes(
            compressed[i],
            compressed[i + 1] ?? 0,
            compressed[i + 2] ?? 0
        );
    }
    return result;
}

// ── Fetch SVG from PlantUML server ───────────────────────────────────────────

function fetchSVG(encoded: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`PlantUML server returned HTTP ${res.statusCode}`));
                res.resume();
                return;
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// ── Webview panel ─────────────────────────────────────────────────────────────

function showPlantUMLPanel(svg: string, title: string): void {
    if (plantUmlPanel) {
        plantUmlPanel.title = `PlantUML: ${title}`;
        plantUmlPanel.reveal(vscode.ViewColumn.Beside, true);
    } else {
        plantUmlPanel = vscode.window.createWebviewPanel(
            'statelangPlantUML',
            `PlantUML: ${title}`,
            { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
            { enableScripts: true, retainContextWhenHidden: true }
        );
        plantUmlPanel.onDidDispose(() => { plantUmlPanel = undefined; });
    }
    plantUmlPanel.webview.html = buildWebviewHtml(svg);
}

function buildWebviewHtml(svg: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #1e1e1e; color: #ccc;
                 font-family: var(--vscode-font-family, sans-serif); overflow: hidden; }
    #toolbar { display: flex; align-items: center; gap: 6px; padding: 6px 12px;
               background: #2d2d2d; border-bottom: 1px solid #444; user-select: none; }
    #toolbar button { background: #3a3a3a; color: #ccc; border: 1px solid #555;
                      border-radius: 3px; padding: 2px 10px; font-size: 14px;
                      cursor: pointer; line-height: 1.4; }
    #toolbar button:hover { background: #505050; }
    #zoom-label { font-size: 12px; min-width: 42px; text-align: center; }
    #canvas { overflow: auto; width: 100%; height: calc(100vh - 38px);
              display: flex; justify-content: center; align-items: flex-start; }
    #diagram { padding: 16px; transform-origin: top center;
               display: inline-block; transition: transform 0.1s ease; }
    #diagram svg { display: block; }
  </style>
</head>
<body>
  <div id="toolbar">
    <button id="btn-zoom-in"  title="Zoom in (Ctrl +)">+</button>
    <button id="btn-zoom-out" title="Zoom out (Ctrl -)">&minus;</button>
    <button id="btn-zoom-reset" title="Reset zoom (Ctrl 0)">&#8635;</button>
    <span id="zoom-label">100%</span>
  </div>
  <div id="canvas">
    <div id="diagram">${svg}</div>
  </div>
  <script>
    (function() {
      let scale = 1;
      const MIN = 0.1, MAX = 5, STEP = 0.15;
      const diagram = document.getElementById('diagram');
      const label   = document.getElementById('zoom-label');

      function applyZoom() {
        diagram.style.transform = 'scale(' + scale.toFixed(3) + ')';
        label.textContent = Math.round(scale * 100) + '%';
      }

      function zoomIn()    { scale = Math.min(MAX, scale + STEP); applyZoom(); }
      function zoomOut()   { scale = Math.max(MIN, scale - STEP); applyZoom(); }
      function zoomReset() { scale = 1; applyZoom(); }

      document.getElementById('btn-zoom-in').addEventListener('click', zoomIn);
      document.getElementById('btn-zoom-out').addEventListener('click', zoomOut);
      document.getElementById('btn-zoom-reset').addEventListener('click', zoomReset);

      // Ctrl+Wheel zoom
      document.getElementById('canvas').addEventListener('wheel', function(e) {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        if (e.deltaY < 0) zoomIn(); else zoomOut();
      }, { passive: false });

      // Keyboard shortcuts
      window.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
          if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn(); }
          else if (e.key === '-')              { e.preventDefault(); zoomOut(); }
          else if (e.key === '0')              { e.preventDefault(); zoomReset(); }
        }
      });
    })();
  </script>
</body>
</html>`;
}

// ── Parse helper ──────────────────────────────────────────────────────────────

async function parseSDL(filePath: string): Promise<Model> {
    const services = createStatelangServices({ ...NodeFileSystem }).Statelang;
    const langDoc = await services.shared.workspace.LangiumDocuments
        .getOrCreateDocument(URI.file(path.resolve(filePath)));
    await services.shared.workspace.DocumentBuilder.build([langDoc], {});
    return langDoc.parseResult.value as Model;
}

// ── Extension lifecycle ───────────────────────────────────────────────────────

// This function is called when the extension is activated.
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    client = await startLanguageClient(context);

    // Command: Generate Java Code (triggered from Explorer context menu)
    context.subscriptions.push(
        vscode.commands.registerCommand('statelang.generateJava', async (uri: vscode.Uri) => {
            // uri comes from Explorer right-click; fall back to active editor
            const filePath = uri?.fsPath ?? vscode.window.activeTextEditor?.document.uri.fsPath;
            if (!filePath || !filePath.endsWith('.sdl')) {
                vscode.window.showWarningMessage('Please invoke this command on a .sdl file.');
                return;
            }
            try {
                const model = await parseSDL(filePath);
                const destination = path.join(path.dirname(filePath), 'src', 'gen');
                generateCode(model, filePath, destination);
                vscode.window.showInformationMessage(`Java code generated in ${destination}`);
            } catch (err) {
                vscode.window.showErrorMessage(`Java code generation failed: ${err}`);
            }
        })
    );

    // Command: Show PlantUML Preview (triggered by editor title button)
    context.subscriptions.push(
        vscode.commands.registerCommand('statelang.showPlantUML', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'statelang') {
                vscode.window.showWarningMessage('Open a .sdl file to show its PlantUML preview.');
                return;
            }
            try {
                const filePath = editor.document.uri.fsPath;
                const model = await parseSDL(filePath);
                const puml = generatePlantUML(model);
                const encoded = encodePlantUML(puml);
                const svg = await fetchSVG(encoded);
                showPlantUMLPanel(svg, path.basename(filePath));
            } catch (err) {
                vscode.window.showErrorMessage(`PlantUML preview failed: ${err}`);
            }
        })
    );

    // Auto-generate .puml file on save; also refresh open webview panel
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async (doc) => {
            if (doc.languageId !== 'statelang') return;
            try {
                const filePath = doc.uri.fsPath;
                const model = await parseSDL(filePath);
                const pumlContent = generatePlantUML(model);

                // Write .puml file
                const outDir = path.join(path.dirname(filePath), 'generator');
                fs.mkdirSync(outDir, { recursive: true });
                const baseName = path.basename(filePath, path.extname(filePath));
                const outFile = path.join(outDir, `${baseName}.puml`);
                fs.writeFileSync(outFile, pumlContent, 'utf8');

                // Refresh webview if open
                if (plantUmlPanel) {
                    const encoded = encodePlantUML(pumlContent);
                    const svg = await fetchSVG(encoded);
                    showPlantUMLPanel(svg, path.basename(filePath));
                }
            } catch (err) {
                vscode.window.showErrorMessage(`PlantUML generation failed: ${err}`);
            }
        })
    );
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
    if (client) {
        return client.stop();
    }
    return undefined;
}

async function startLanguageClient(context: vscode.ExtensionContext): Promise<LanguageClient> {
    const serverModule = context.asAbsolutePath(path.join('out', 'language', 'main.cjs'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
    // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
    const debugOptions = { execArgv: ['--nolazy', `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: '*', language: 'statelang' }]
    };

    // Create the language client and start the client.
    const client = new LanguageClient(
        'statelang',
        'statelang',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    await client.start();
    return client;
}
