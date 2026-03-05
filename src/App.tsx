/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { 
  Upload, 
  Sparkles, 
  Image as ImageIcon, 
  Loader2, 
  Download, 
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { transformProductPhoto } from './services/gemini';

interface ImageState {
  file: File | null;
  preview: string | null;
  transformed: string | null;
  status: 'idle' | 'uploading' | 'transforming' | 'done' | 'error';
  error?: string;
}

export default function App() {
  const [state, setState] = useState<ImageState>({
    file: null,
    preview: null,
    transformed: null,
    status: 'idle',
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setState({
          file,
          preview: reader.result as string,
          transformed: null,
          status: 'idle',
        });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  } as any);

  const handleTransform = async () => {
    if (!state.preview || !state.file) return;

    setState(prev => ({ ...prev, status: 'transforming', error: undefined }));

    try {
      const result = await transformProductPhoto(state.preview, state.file.type);
      setState(prev => ({
        ...prev,
        transformed: result,
        status: 'done',
      }));
    } catch (err) {
      console.error(err);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: 'Failed to transform image. Please try again.',
      }));
    }
  };

  const handleReset = () => {
    setState({
      file: null,
      preview: null,
      transformed: null,
      status: 'idle',
    });
  };

  const handleDownload = () => {
    if (!state.transformed) return;
    const link = document.createElement('a');
    link.href = state.transformed;
    link.download = `transformed-${state.file?.name || 'product'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-display font-bold text-xl tracking-tight">ProProduct Studio</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Powered by Gemini</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls & Upload */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold text-zinc-900">Professional Product Shots</h2>
              <p className="text-zinc-500">Upload a basic photo and let AI transform it into a professional studio shot with a clean white background.</p>
            </div>

            {!state.preview ? (
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4",
                  isDragActive ? "border-zinc-900 bg-zinc-100" : "border-zinc-200 hover:border-zinc-400 bg-white"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-zinc-400" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900">Click or drag photo here</p>
                  <p className="text-sm text-zinc-500">PNG, JPG or WEBP up to 10MB</p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-700 truncate max-w-[200px]">
                      {state.file?.name}
                    </span>
                  </div>
                  <button 
                    onClick={handleReset}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Change
                  </button>
                </div>

                <div className="aspect-square rounded-xl overflow-hidden bg-zinc-100 border border-zinc-100">
                  <img 
                    src={state.preview} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <button
                  onClick={handleTransform}
                  disabled={state.status === 'transforming'}
                  className={cn(
                    "w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-zinc-200",
                    state.status === 'transforming' 
                      ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" 
                      : "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]"
                  )}
                >
                  {state.status === 'transforming' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Transforming...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Transform to Studio Shot
                    </>
                  )}
                </button>

                {state.status === 'error' && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="text-xs font-medium">{state.error}</p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-zinc-900 text-white p-6 rounded-2xl space-y-4">
              <h3 className="font-display font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Studio Quality
              </h3>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-zinc-600 rounded-full mt-2 shrink-0" />
                  Pure white background removal
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-zinc-600 rounded-full mt-2 shrink-0" />
                  Professional studio lighting
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-zinc-600 rounded-full mt-2 shrink-0" />
                  Enhanced product details
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-zinc-200 rounded-3xl p-4 md:p-8 h-full min-h-[500px] flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-lg">Result</h3>
                {state.transformed && (
                  <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full text-sm font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>

              <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {state.status === 'transforming' ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="relative">
                        <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
                        <Sparkles className="w-6 h-6 text-zinc-400 absolute -top-2 -right-2 animate-pulse" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-zinc-900">AI is working its magic</p>
                        <p className="text-sm text-zinc-500">This usually takes about 10-15 seconds</p>
                      </div>
                    </motion.div>
                  ) : state.transformed ? (
                    <motion.img 
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={state.transformed} 
                      alt="Transformed" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <motion.div 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center p-12"
                    >
                      <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-10 h-10 text-zinc-300" />
                      </div>
                      <p className="text-zinc-400 font-medium">Your transformed photo will appear here</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-zinc-200 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-zinc-500">© 2026 ProProduct Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
