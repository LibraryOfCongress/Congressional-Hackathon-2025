import * as vscode from 'vscode';
import * as path from 'path';
import fetch from 'node-fetch'; // Install node-fetch if not already installed

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

    const cssContents: string[] = [];
    let xslContent: string | null = null;

    for (const ref of stylesheetRefs) {
        if (ref.type === 'text/css') {
            if (isExternalUrl(ref.href)) {
                try {
                    const cssContent = await fetchCssContent(ref.href);
                    // Handle relative URLs within the CSS content
                    const adjustedCssContent = adjustCssUrls(cssContent, ref.href, panel);
                    cssContents.push(adjustedCssContent);
                } catch (error) {
                    let errorMessage = 'Unknown error';
                    if (error instanceof Error) {
                        errorMessage = error.message;
                    }
                    panel.webview.html = getErrorContent(`Error loading external CSS file: ${errorMessage}`);
                    return;
                }
            } else {
                const cssUri = vscode.Uri.joinPath(xmlDocument.uri, '..', ref.href);
                try {
                    const cssDocument = await vscode.workspace.openTextDocument(cssUri);
                    cssContents.push(cssDocument.getText());
                } catch (error) {
                    let errorMessage = 'Unknown error';
                    if (error instanceof Error) {
                        errorMessage = error.message;
                    }
                    panel.webview.html = getErrorContent(`Error loading CSS file: ${errorMessage}`);
                    return;
                }
            }
        } else if (ref.type === 'text/xsl') {
            const xslUri = isExternalUrl(ref.href)
                ? vscode.Uri.parse(ref.href)
                : vscode.Uri.joinPath(xmlDocument.uri, '..', ref.href);
            try {
                const xslContentResult = await fetchXslContent(xslUri);
                xslContent = xslContentResult;
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

    const htmlContent = generateWebviewContent(panel, xmlContent, xslContent, cssContents);
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

function isExternalUrl(url: string): boolean {
    return /^(https?:)?\/\//.test(url);
}

async function fetchCssContent(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch CSS file: ${response.statusText}`);
    }
    return await response.text();
}

async function fetchXslContent(uri: vscode.Uri): Promise<string> {
    if (uri.scheme === 'http' || uri.scheme === 'https') {
        const response = await fetch(uri.toString());
        if (!response.ok) {
            throw new Error(`Failed to fetch XSL file: ${response.statusText}`);
        }
        return await response.text();
    } else {
        const xslDocument = await vscode.workspace.openTextDocument(uri);
        return xslDocument.getText();
    }
}

function adjustCssUrls(cssContent: string, cssUrl: string, panel: vscode.WebviewPanel): string {
    // Adjust relative URLs in CSS content to absolute URLs
    const urlRegex = /url\(['"]?(.*?)['"]?\)/g;
    return cssContent.replace(urlRegex, (match, p1) => {
        let url = p1.trim();
        if (!isExternalUrl(url) && !url.startsWith('data:')) {
            // Resolve relative URLs
            const baseUri = vscode.Uri.parse(cssUrl);
            const resolvedUri = vscode.Uri.joinPath(baseUri, '..', url);
            const webviewUri = panel.webview.asWebviewUri(resolvedUri);
            return `url('${webviewUri}')`;
        }
        return match;
    });
}

function generateWebviewContent(
    panel: vscode.WebviewPanel,
    xmlContent: string,
    xslContent: string | null,
    cssContents: string[]
): string {
    const nonce = getNonce();

    // Prepare CSS style tags
    const cssStyles = cssContents.map(css => `<style>${css}</style>`).join('\n');

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
                const xmlString = \`${escapeBackticks(xmlContent)}\`;
                const xslString = \`${escapeBackticks(xslContent)}\`;

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
                const xmlString = \`${escapeBackticks(xmlContent)}\`;
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
      ${cssStyles}
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

function escapeBackticks(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
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
