'use client'

import { useState, ChangeEvent, DragEvent, JSX } from "react";

export default function TranscriptField(): JSX.Element {
    
    const [fileContent, setFileContent] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFile = (file: File): void => {
    if (file.type !== 'text/plain') {
      alert('Only .txt files are supported');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setFileContent(result);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-red-500 animate-gradient-x p-[2px] rounded-xl">
  <div
    onDragEnter={handleDrag}
    onDragOver={handleDrag}
    onDragLeave={handleDrag}
    onDrop={handleDrop}
    className="bg-white rounded-xl p-8 text-center"
  >
    <p className="text-gray-700">Drag and drop a transcript file here, or click to upload</p>
    <input
      type="file"
      accept=".txt"
      onChange={handleChange}
      className="hidden"
      id="fileUpload"
    />
    <label htmlFor="fileUpload" className="cursor-pointer text-blue-600 underline">
      Browse Files
    </label>
  </div>
</div>
  );
}
