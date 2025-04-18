'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return alert('Please upload a resume.');

    const formData = new FormData();
    formData.append('resume', file);

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert('Error analyzing resume.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl p-6 bg-white shadow-xl rounded-xl">
        <h1 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
          📄 AI Resume Analyzer
        </h1>
        <div className="mb-4">
          <a
            href="/sample_resume.docx"
            download
            className="block text-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-all"
          >
            📄 Download Sample Resume (.docx)
          </a>
        </div>

        <label
          htmlFor="file-upload"
          className="block w-full mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-600 hover:border-blue-500 hover:text-blue-600 cursor-pointer transition-all"
        >
          {file ? file.name : '📂 Click to upload or drag your .docx or .txt file here'}
          <input
            id="file-upload"
            type="file"
            accept=".docx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <button
          onClick={handleAnalyze}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 w-full font-semibold transition-all"
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>

        {result && (
          <div className="mt-6 space-y-4 text-gray-800">
            <p className="text-lg font-semibold text-red-600 flex items-center gap-2">
              🎯 <span className="text-black">Score:</span>{' '}
              <span className="text-blue-600">{result.score}/10</span>
            </p>

            <div>
              <p className="font-semibold flex items-center gap-2 text-green-700">
                ✅ Strengths:
              </p>
              <ul className="list-disc list-inside text-sm mt-1 text-gray-700">
                {(result.positives || []).length > 0 ? (
                  result.positives.map((point: string, i: number) => <li key={i}>{point}</li>)
                ) : (
                  <li className="text-gray-400">No strengths found.</li>
                )}
              </ul>
            </div>

            <div>
              <p className="font-semibold flex items-center gap-2 text-yellow-700">
                🛠️ Suggestions:
              </p>
              <ul className="list-disc list-inside text-sm mt-1 text-gray-700">
                {(result.improvements || []).length > 0 ? (
                  result.improvements.map((point: string, i: number) => <li key={i}>{point}</li>)
                ) : (
                  <li className="text-gray-400">No suggestions found.</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
