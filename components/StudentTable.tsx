"use client";

import React, { useState } from "react";
import { StudentRecord } from "@/lib/types";
import { Search, Eye, Download, GraduationCap, Calendar, Hash } from "lucide-react";

interface StudentTableProps {
  records: StudentRecord[];
  onPreview: (record: StudentRecord) => void;
  onDownloadSingle: (record: StudentRecord) => void;
  isProcessing: boolean;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  records,
  onPreview,
  onDownloadSingle,
  isProcessing,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = records.filter(
    (r) =>
      r.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentId.includes(searchTerm)
  );

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Table Header & Search Bar */}
      <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-semibold text-zinc-100">
            Parsed Student Records ({filtered.length} / {records.length})
          </h2>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student or ID..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[520px]">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider sticky top-0 z-10 backdrop-blur border-b border-zinc-800">
            <tr>
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Student ID</th>
              <th className="py-3 px-4">Applicant Name</th>
              <th className="py-3 px-4">Date of Birth</th>
              <th className="py-3 px-4">Applying Course</th>
              <th className="py-3 px-4">Education Period</th>
              <th className="py-3 px-4">Issue Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-zinc-500 font-sans">
                  No matching student records found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.studentId}
                  className="hover:bg-zinc-800/40 transition group"
                >
                  <td className="py-2.5 px-4 text-zinc-500 text-[11px]">{r.slNo}</td>
                  <td className="py-2.5 px-4 font-semibold text-indigo-400">
                    {r.studentId}
                  </td>
                  <td className="py-2.5 px-4 font-sans font-medium text-zinc-100">
                    {r.applicantName}
                  </td>
                  <td className="py-2.5 px-4 text-[11px] text-zinc-400">
                    {r.dobFormatted}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-xs text-zinc-300">
                    {r.applyingCourse}
                  </td>
                  <td className="py-2.5 px-4 text-[11px] text-zinc-400">
                    {r.educationPeriod}
                  </td>
                  <td className="py-2.5 px-4 text-[11px] text-zinc-500">
                    {r.issueDate}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 font-sans">
                      <button
                        type="button"
                        onClick={() => onPreview(r)}
                        disabled={isProcessing}
                        className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
                        title="Preview certificate"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownloadSingle(r)}
                        disabled={isProcessing}
                        className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-emerald-950 hover:border-emerald-700/80 text-zinc-300 hover:text-emerald-400 transition"
                        title="Download single PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
