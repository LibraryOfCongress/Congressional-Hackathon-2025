<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" indent="yes"/>
    <xsl:template match="/">
        <html>
            <head>
                <title>
                    <xsl:value-of select="legislation/title"/>
                </title>
                <style>
                    body { font-family: Times New Roman, serif; margin: 40px; }
                    h1 {font-size: 60px}
                    h2 { margin-top: 20px; }
                    p { margin: 5px 0; }
                    .sponsor { font-style: italic; }
                </style>
            </head>
            <body>
                <h1><xsl:value-of select="legislation/title"/></h1>
                <p><strong>Bill Number:</strong> <xsl:value-of select="legislation/number"/></p>
                <p class="sponsor"><strong>Sponsor:</strong> <xsl:value-of select="legislation/sponsor/name"/> (<xsl:value-of select="legislation/sponsor/state"/>)</p>
                <p><strong>Date Introduced:</strong> <xsl:value-of select="legislation/dateIntroduced"/></p>
                <h2>Summary</h2>
                <p><xsl:value-of select="legislation/summary"/></p>
                <xsl:for-each select="legislation/sections/section">
                    <h2><xsl:value-of select="title"/></h2>
                    <p><xsl:value-of select="text"/></p>
                </xsl:for-each>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
