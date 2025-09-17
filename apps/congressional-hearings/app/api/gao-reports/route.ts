import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

export async function GET(request: NextRequest) {
  try {
    const gaoReportsDir = path.join(process.cwd(), '..', '..', 'gao_reports');
    
    // Check if directory exists
    if (!fs.existsSync(gaoReportsDir)) {
      return NextResponse.json(
        { error: 'GAO reports directory not found' },
        { status: 404 }
      );
    }

    // Read all markdown files
    const files = fs.readdirSync(gaoReportsDir).filter(file => file.endsWith('.md'));
    
    const reports = files.map(file => {
      const filePath = path.join(gaoReportsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data: metadata } = matter(fileContent);
      
      const reportId = file.replace('.md', '');
      const reportTitle = metadata.Title || metadata.title || 'Untitled Report';
      const reportDate = metadata.CreationDate 
        ? new Date(metadata.CreationDate).toISOString().split('T')[0]
        : metadata.processed_date?.split('T')[0] || new Date().toISOString().split('T')[0];

      return {
        id: reportId,
        title: reportTitle,
        date: reportDate,
        filename: file,
        metadata: metadata,
      };
    });

    // Sort by date (newest first)
    reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      reports,
      total: reports.length,
    });

  } catch (error) {
    console.error('Error fetching GAO reports list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
