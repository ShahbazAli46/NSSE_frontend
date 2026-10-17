'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Camera, 
  Users, 
  ArrowRight,
  Calendar, 
  X
} from 'lucide-react';
import { getAuthToken } from '@/lib/api';

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunk slice

interface ImportSummary {
  session: string;
  total_processed: number;
  created_count: number;
  updated_count: number;
  photos_attached: number;
  classes_summary: Record<string, number>;
}

export default function StudentRegisterImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState('2026-2027');
  const [isCustomSession, setIsCustomSession] = useState(false);
  const [customSession, setCustomSession] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
      setErrorMsg('Please select a valid Excel (.xlsx) or CSV file.');
      return;
    }

    setSelectedFile(file);
    setErrorMsg('');
    setImportSummary(null);
    setUploadProgress(0);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
      setErrorMsg('Please select a valid Excel (.xlsx) or CSV file.');
      return;
    }

    setSelectedFile(file);
    setErrorMsg('');
    setImportSummary(null);
    setUploadProgress(0);
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;

    const token = getAuthToken();
    if (!token) {
      setErrorMsg('Institutional session expired. Please refresh or log in again.');
      return;
    }

    setIsUploading(true);
    setIsProcessing(false);
    setErrorMsg('');
    setUploadProgress(0);

    const fileSize = selectedFile.size;
    const chunks = Math.ceil(fileSize / CHUNK_SIZE);
    setTotalChunks(chunks);

    const uploadId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

    try {
      for (let i = 0; i < chunks; i++) {
        setCurrentChunk(i + 1);
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);
        const chunkBlob = selectedFile.slice(start, end);

        const targetSession = isCustomSession ? (customSession.trim() || '2026-2027') : session;

        const formData = new FormData();
        formData.append('file', chunkBlob, `chunk_${i}`);
        formData.append('upload_id', uploadId);
        formData.append('chunk_index', i.toString());
        formData.append('total_chunks', chunks.toString());
        formData.append('file_name', selectedFile.name);
        formData.append('session', targetSession);

        const isLastChunk = i === chunks - 1;
        if (isLastChunk) {
          setIsProcessing(true);
        }

        const res = await fetch(`${apiUrl}/students/upload-chunk`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || `Upload failed on chunk ${i + 1}.`);
        }

        const progress = Math.round(((i + 1) / chunks) * 100);
        setUploadProgress(progress);

        if (data.completed && data.summary) {
          setImportSummary(data.summary);
          setIsUploading(false);
          setIsProcessing(false);
          return;
        }
      }
    } catch (err: any) {
      console.error('Chunk upload error:', err);
      setErrorMsg(err.message || 'An error occurred during file upload or processing.');
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportSummary(null);
    setErrorMsg('');
    setUploadProgress(0);
    setCurrentChunk(0);
    setTotalChunks(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-4xl mx-auto">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#0B462C] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Students Directory</span>
        </Link>
      </div>

      {/* Academic Session Target Selector */}
      {!importSummary && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#0B462C]" />
              Target Academic Session
            </label>
            <span className="text-[11px] text-gray-400 font-medium">
              Active: <strong className="text-[#0B462C]">{isCustomSession ? (customSession || 'Custom') : session}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {['2026-2027', '2025-2026', '2027-2028'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSession(s);
                  setIsCustomSession(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isCustomSession && session === s
                    ? 'bg-[#0B462C] text-[#E8D4A2] shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/70'
                }`}
              >
                {s} {s === '2026-2027' && '★ (Current)'}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsCustomSession(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isCustomSession
                  ? 'bg-[#0B462C] text-[#E8D4A2] shadow-sm'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/70'
              }`}
            >
              + Other Session
            </button>
          </div>

          {isCustomSession && (
            <div className="pt-2">
              <input
                type="text"
                placeholder="e.g. 2024-2025"
                value={customSession}
                onChange={(e) => setCustomSession(e.target.value)}
                className="w-full max-w-xs px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#0B462C] outline-none"
              />
            </div>
          )}

          <p className="text-[11px] text-gray-400">
            Enrolling students into this session. Records are matched by Registration No within this session to prevent duplicates.
          </p>
        </div>
      )}

      {/* Upload Box / Dropzone */}
      {!importSummary ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          {!selectedFile ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-[#0B462C] rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all hover:bg-gray-50/50 flex flex-col items-center justify-center gap-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 group-hover:text-[#0B462C] group-hover:bg-[#0B462C]/10 flex items-center justify-center transition-colors">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-800">
                  Click to select or drag & drop your Excel file here
                </p>
                <p className="text-xs text-gray-400">
                  Accepts government export (.xlsx) of any size (e.g. 50MB - 100MB+)
                </p>
              </div>
              <span className="mt-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold group-hover:bg-[#0B462C] group-hover:text-white transition-colors">
                Browse Files
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected File Card */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                      {selectedFile.name}
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Excel Workbook'}
                    </div>
                  </div>
                </div>

                {!isUploading && (
                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload & Processing Progress Bar */}
              {isUploading && (
                <div className="space-y-3 p-5 rounded-2xl bg-[#0B462C]/5 border border-[#0B462C]/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0B462C] flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {isProcessing
                        ? 'Assembling chunks & extracting student photos on server...'
                        : `Streaming chunk ${currentChunk} of ${totalChunks}...`}
                    </span>
                    <span className="font-mono font-bold text-gray-700">{uploadProgress}%</span>
                  </div>

                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0B462C] to-[#C5A059] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>File size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    <span>2MB chunked protocol</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Import Failed</strong>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleReset}
                  className="px-6 py-3.5 rounded-2xl border border-gray-200 text-xs sm:text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all cursor-pointer text-center shrink-0"
                >
                  Choose Different File
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleStartUpload}
                  className="flex-1 px-8 py-3.5 rounded-2xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer text-center"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-[#C5A059]" />
                      <span>{isProcessing ? 'Processing & Extracting Photos...' : 'Streaming Chunks to Server...'}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4.5 h-4.5 shrink-0 text-[#C5A059]" />
                      <span>Upload & Process Register</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Success Report Card */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-md space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-cinzel">
                  Student Register Processed Successfully!
                </h2>
                <p className="text-xs text-gray-500">
                  All records have been synchronized and photos safely archived.
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-[#0B462C] text-[#E8D4A2] text-xs font-bold self-start sm:self-auto">
                Session: {importSummary.session}
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
              <span className="text-[11px] font-semibold text-gray-400 block">Total Processed</span>
              <span className="text-2xl font-black text-gray-900 mt-1 block">
                {importSummary.total_processed}
              </span>
            </div>
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-center">
              <span className="text-[11px] font-semibold text-emerald-700 block">New Created</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                +{importSummary.created_count}
              </span>
            </div>
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 text-center">
              <span className="text-[11px] font-semibold text-blue-700 block">Existing Updated</span>
              <span className="text-2xl font-black text-blue-700 mt-1 block">
                {importSummary.updated_count}
              </span>
            </div>
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 text-center">
              <span className="text-[11px] font-semibold text-amber-800 block">Photos Extracted</span>
              <span className="text-2xl font-black text-amber-800 mt-1 block flex items-center justify-center gap-1">
                <Camera className="w-4 h-4" />
                {importSummary.photos_attached}
              </span>
            </div>
          </div>

          {/* Class Breakdown */}
          {importSummary.classes_summary && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Enrollment Breakdown by Class:
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(importSummary.classes_summary).map(([cls, count]) => (
                  <span
                    key={cls}
                    className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 flex items-center gap-1.5"
                  >
                    <span>{cls}:</span>
                    <strong className="text-[#0B462C]">{count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={handleReset}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-xs sm:text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Upload Another Register
            </button>
            <Link
              href="/dashboard/students"
              className="flex-1 py-3 rounded-2xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Go to Students Directory</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
