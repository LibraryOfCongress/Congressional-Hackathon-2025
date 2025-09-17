'use client'

import { useState, ChangeEvent } from "react";

export default function TranscriptField() {
    
    const [fileContent, setFileContent] = useState<string>('');

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (file.type !== 'text/plain') {
        alert('Please select a valid .txt file');
        return;
        }

        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
            setFileContent(result);
        }
        };

        reader.onerror = () => {
        console.error('Error reading file');
        };

        reader.readAsText(file);
    };
    
    return (
        <div>
            <label htmlFor="transcript">Upload your transcript here</label>
            <input id="transcript" type="file" accept=".txt" onChange={handleFileChange} />
        </div>
    )

}