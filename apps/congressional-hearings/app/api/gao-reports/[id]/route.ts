import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    
    // Construct the file path
    const gaoReportsDir = path.join(process.cwd(), '..', '..', 'gao_reports');
    const fileName = `${reportId.toLowerCase()}.md`;
    const filePath = path.join(gaoReportsDir, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Read and parse the markdown file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: metadata, content } = matter(fileContent);

    // Extract report information
    const reportTitle = metadata.Title || metadata.title || 'Untitled Report';
    const reportDate = metadata.CreationDate 
      ? new Date(metadata.CreationDate).toISOString().split('T')[0]
      : metadata.processed_date?.split('T')[0] || new Date().toISOString().split('T')[0];

    const reportData = {
      id: reportId,
      title: reportTitle,
      date: reportDate,
      content: content,
      metadata: metadata,
    };

    return NextResponse.json(reportData);

  } catch (error) {
    console.error('Error fetching GAO report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
