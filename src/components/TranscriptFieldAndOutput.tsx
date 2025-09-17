'use client'

import axios from "axios";
import { useState, ChangeEvent, DragEvent, JSX, useEffect } from "react";

export default function TranscriptFieldAndOutput(): JSX.Element {
    
    const [fileContent, setFileContent] = useState<string>('');
    const [fileName, setFileCName] = useState<string | null>(null);
    const [aiOutput, setAIOutput] = useState<string | null>(null)
    const [aiLoading, setAILoading] = useState<boolean>(false);
    const [dragActive, setDragActive] = useState<boolean>(false);

  useEffect(() => {
    
    async function callLLM() {
        setAILoading(true)
        try {
            const response = await axios.post("/api", fileContent)
            setAILoading(false)
            setAIOutput(response.data.output[1].content[0].text)
        } catch (error) {
            console.error("There was an error calling the LLM", error)
            setAILoading(false)
        }
    }
    
    if (fileContent) {
        callLLM()
    }
  }, [fileContent])

  const handleFile = (file: File): void => {
    if (file.type !== 'text/plain') {
      alert('Only .txt files are supported');
      return;
    }
    if (file) {
        setFileCName(file.name)
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
    <>
    <div className="bg-gradient-to-r from-blue-500 to-red-500 animate-gradient-x p-[2px] rounded-xl">
  <div
    onDragEnter={handleDrag}
    onDragOver={handleDrag}
    onDragLeave={handleDrag}
    onDrop={handleDrop}
    className={`${dragActive ? 'bg-blue-50' : 'bg-white'} rounded-xl p-8 text-center`}
  >
    {!fileName ?
    <>
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
    </>
    :
    <>
    <p className="text-gray-700">"{fileName}" selected</p>
    <input
      type="file"
      accept=".txt"
      onChange={handleChange}
      className="hidden"
      id="fileUpload"
    />
    <label htmlFor="fileUpload" className="cursor-pointer text-blue-600 underline">
      Update Selected File
    </label>
    </>
    }
  </div>
</div>
{!aiLoading ?
fileContent &&
<div>
  <p>In this transcript, the speakers map to these people:</p>
  <pre>{aiOutput}</pre>
</div>
:
<div>
  <div className="container">
    <span></span>
    <span></span>
    <span></span>
    <span></span>
  </div>
</div>
}
</>
  );
}
