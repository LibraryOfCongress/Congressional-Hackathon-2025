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
                    // Include the directory of the XML document in localResourceRoots
                    localResourceRoots: [
                        vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview')),
                        vscode.Uri.joinPath(editor.document.uri, '..')
                    ],
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
    const stylesheetRefs = extractStylesheetRefs(xmlContent);

    const cssFiles: vscode.Uri[] = [];
    let xslContent: string | null = null;

    for (const ref of stylesheetRefs) {
        if (ref.type === 'text/css') {
            const cssUri = vscode.Uri.joinPath(xmlDocument.uri, '..', ref.href);
            cssFiles.push(cssUri);
        } else if (ref.type === 'text/xsl') {
            const xslUri = vscode.Uri.joinPath(xmlDocument.uri, '..', ref.href);
            try {
                const xslDocument = await vscode.workspace.openTextDocument(xslUri);
                xslContent = xslDocument.getText();
            } catch (error) {
                let errorMessage = 'Unknown error';
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                panel.webview.html = getErrorContent(`Error loading XSL file: ${errorMessage}`);
                return;
            }
        }
    }

    // Update localResourceRoots to include CSS directories
    const cssDirectories = cssFiles.map(cssUri => vscode.Uri.joinPath(cssUri, '..'));
    panel.webview.options = {
        ...panel.webview.options,
        localResourceRoots: [
            ...(panel.webview.options.localResourceRoots || []),
            ...cssDirectories
        ]
    };

    const htmlContent = generateWebviewContent(panel, xmlContent, xslContent, cssFiles);
    panel.webview.html = htmlContent;
}

function extractStylesheetRefs(xmlContent: string): { href: string; type: string }[] {
    const regex = /<\?xml-stylesheet\s+(.*?)\?>/g;
    let match;
    const refs: { href: string; type: string }[] = [];

    while ((match = regex.exec(xmlContent)) !== null) {
        const attrs = match[1];
        const hrefMatch = attrs.match(/href=["'](.+?)["']/);
        const typeMatch = attrs.match(/type=["'](.+?)["']/);
        if (hrefMatch && typeMatch) {
            refs.push({ href: hrefMatch[1], type: typeMatch[1] });
        }
    }

    return refs;
}

function generateWebviewContent(
    panel: vscode.WebviewPanel,
    xmlContent: string,
    xslContent: string | null,
    cssFiles: vscode.Uri[]
): string {
    const nonce = getNonce();

    // Prepare CSS links
    const cssLinks = cssFiles.map(cssUri => {
        const webviewUri = panel.webview.asWebviewUri(cssUri);
        return `<link rel="stylesheet" type="text/css" href="${webviewUri}">`;
    }).join('\n');

    // Adjust CSP to allow styles and resources from the webview URIs
    const cspSource = panel.webview.cspSource;
    const csp = `
        default-src 'none';
        script-src 'nonce-${nonce}';
        style-src 'unsafe-inline' ${cspSource};
        font-src ${cspSource};
        img-src ${cspSource} data:;
    `;

    let transformationScript = '';

    if (xslContent) {
        // XSLT transformation script
        transformationScript = `
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
        `;
    } else {
        // Display the XML content directly
        transformationScript = `
            (function() {
                const parser = new DOMParser();
                const xmlString = \`${xmlContent.replace(/`/g, '\\`')}\`;
                const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

                const serializer = new XMLSerializer();
                const xmlHtml = serializer.serializeToString(xmlDoc);

                document.getElementById('content').innerHTML = xmlHtml;
            })();
        `;
    }

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <!-- CSP to only allow scripts with the nonce -->
      <meta http-equiv="Content-Security-Policy" content="${csp}">
      <title>XML Preview</title>
      ${cssLinks}
    </head>
    <body>
      <div id="content"></div>
      <script nonce="${nonce}">
        ${transformationScript}
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
