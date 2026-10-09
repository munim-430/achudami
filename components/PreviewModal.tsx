'use client';

import React, { useEffect } from 'react';
import { X, Download, FileText, CheckCircle2, User, Hash, Calendar, GraduationCap } from 'lucide-react';
import { StudentRecord } from '@/lib/types';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord | null;
  pdfUrl: string | null;
  isLoading?: boolean;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  student,
  pdfUrl,
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !student) return null;

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${student.studentId}_${student.applicantName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div 
        className="relative flex flex-col w-full max-w-5xl h-[92vh] bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                  {student.applicantName}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/70 border border-emerald-800/80 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Vector Calibrated
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                ID: {student.studentId} • Hanyang University Confirmation of Acceptance
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {pdfUrl && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split view (Metadata Sidebar + PDF Preview Embed) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Metadata Panel */}
          <div className="w-full md:w-80 bg-zinc-950/90 border-r border-zinc-800 p-5 overflow-y-auto space-y-4 text-xs">
            <div>
              <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
                Dynamic Injection Fields
              </h4>
              <div className="space-y-2.5">
                <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <div className="flex items-center text-[11px] text-zinc-400 font-medium mb-1">
                    <Hash className="w-3.5 h-3.5 mr-1.5 text-zinc-500" /> Student ID No.
                  </div>
                  <div className="font-mono font-semibold text-indigo-400">
                    {student.studentId}
                  </div>
                </div>

                <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <div className="flex items-center text-[11px] text-zinc-400 font-medium mb-1">
                    <User className="w-3.5 h-3.5 mr-1.5 text-zinc-500" /> Applicant Name
                  </div>
                  <div className="font-bold text-zinc-100">
                    {student.applicantName}
                  </div>
                </div>

                <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <div className="flex items-center text-[11px] text-zinc-400 font-medium mb-1">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-500" /> Date of Birth
                  </div>
                  <div className="font-mono text-zinc-200">
                    {student.dobFormatted}
                  </div>
                </div>

                <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <div className="flex items-center text-[11px] text-zinc-400 font-medium mb-1">
                    <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-zinc-500" /> Applying Course
                  </div>
                  <div className="text-zinc-200 font-medium">
                    {student.applyingCourse}
                  </div>
                  <div className="text-zinc-400 text-[10px] mt-0.5">
                    {student.degreeProgram}
                  </div>
                </div>

                <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <div className="flex items-center text-[11px] text-zinc-400 font-medium mb-1">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-500" /> Education Period
                  </div>
                  <div className="font-mono text-zinc-200">
                    {student.educationPeriod}
                  </div>
                </div>

                <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                  <div className="text-[11px] text-zinc-400 font-medium mb-1">
                    Official Issue Date
                  </div>
                  <div className="font-mono text-zinc-200">
                    {student.issueDate}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
              <span className="font-semibold text-emerald-400 block">✓ Redaction Fidelity</span>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                University coat of arms, Korean static text, watermarks, and red official seal are 100% preserved with zero raster blur or displacement.
              </p>
            </div>
          </div>

          {/* Right Preview Frame */}
          <div className="flex-1 bg-zinc-950 relative flex items-center justify-center p-3">
            {isLoading ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium text-zinc-400">Rendering Certificate Vector Stream...</p>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full h-full rounded-xl bg-white shadow-2xl border border-zinc-800"
                title={`Certificate Preview - ${student.applicantName}`}
              />
            ) : (
              <div className="text-zinc-500 text-xs">Failed to generate preview</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
