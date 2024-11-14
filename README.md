# XML Preview Extension

This extension provides a formatted preview for XML documents based on associated XSL stylesheets.

## Features

- Live preview of XML transformations using XSLT.
- Updates the preview when the XML or XSL files are edited.

## Usage

1. Open an XML file that contains an `<?xml-stylesheet?>` reference to an XSL file.
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and select `Start XML Preview`.
3. The preview will open in a new pane beside the XML file.

## Requirements

- The XML file must include a reference to an XSL stylesheet.
- The XSL file path must be correct and accessible.

## Extension Settings

None.

## Known Issues

- Only supports XSLT 1.0 due to browser limitations.
- Does not support external resources in XSL (like `document()` function).

## Release Notes

### 1.0.0

- Initial release.
