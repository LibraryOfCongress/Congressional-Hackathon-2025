import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('xmlPreview.start', () => {
        const editor = vscode.window.activeTextEditor;

        if (editor && editor.document.languageId === 'xml') {
            const panel = vscode.window.createWebviewPanel(
                'xmlPreview',
                'XML Preview',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview'))],
                }
            );

            updateWebviewContent(panel, context, editor.document);

            const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
                if (e.document.uri.toString() === editor.document.uri.toString()) {
                    updateWebviewContent(panel, context, e.document);
                }
            });

            panel.onDidDispose(() => {
                changeDocumentSubscription.dispose();
            });
        } else {
            vscode.window.showErrorMessage('Please open an XML file to preview.');
        }
    });

    context.subscriptions.push(disposable);
}

async function updateWebviewContent(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    xmlDocument: vscode.TextDocument
) {
    const xmlContent = xmlDocument.getText();
    const xslHref = extractXslHref(xmlContent);

    if (xslHref) {
        const xslUri = vscode.Uri.joinPath(xmlDocument.uri, '..', xslHref);
        try {
            const xslDocument = await vscode.workspace.openTextDocument(xslUri);
            const xslContent = xslDocument.getText();

            const htmlContent = generateWebviewContent(panel, xmlContent, xslContent);
            panel.webview.html = htmlContent;
        } catch (error) {
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            panel.webview.html = getErrorContent(`Error loading XSL file: ${errorMessage}`);
        }
    } else {
        panel.webview.html = getErrorContent('No XSL stylesheet reference found in the XML document.');
    }
}

function extractXslHref(xmlContent: string): string | null {
    const match = xmlContent.match(/<\?xml-stylesheet.*href=["'](.+?)["']/);
    return match ? match[1] : null;
}

function generateWebviewContent(
    panel: vscode.WebviewPanel,
    xmlContent: string,
    xslContent: string
): string {
    const nonce = getNonce();
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <!-- CSP to only allow scripts with the nonce -->
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
      <title>XML Preview</title>
    </head>
    <body>
      <div id="content"></div>
      <script nonce="${nonce}">
        (function() {
          const parser = new DOMParser();
          const xmlString = \`${xmlContent.replace(/`/g, '\\`')}\`;
          const xslString = \`${xslContent.replace(/`/g, '\\`')}\`;

          const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
          const xslDoc = parser.parseFromString(xslString, 'text/xml');

          const xsltProcessor = new XSLTProcessor();
          xsltProcessor.importStylesheet(xslDoc);

          const resultDocument = xsltProcessor.transformToFragment(xmlDoc, document);

          document.getElementById('content').appendChild(resultDocument);
        })();
      </script>
    </body>
    </html>
  `;
}

function getErrorContent(errorMessage: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <body>
      <h3>Error</h3>
      <pre>${errorMessage}</pre>
    </body>
    </html>
  `;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function deactivate() { }
