import { UploadCloud, FileType, FolderOpen, Save } from "lucide-react";
import { useState } from "react";

export default function FontExtractorUI() {
  const [isDragging, setIsDragging] = useState(false);
  const [extractedFonts] = useState([
    { name: "Helvetica Neue", type: "TrueType", weight: "Bold", embedded: true },
    { name: "Inter", type: "OpenType", weight: "Regular", embedded: false },
    { name: "Roboto Mono", type: "TrueType", weight: "Medium", embedded: true }
  ]);
  const [isExtracted, setIsExtracted] = useState(false);

  return (
    <div className="flex flex-col h-full gap-8 animate-fadeIn">
      {/* Upload Zone */}
      <div 
        className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 transition-all duration-300 ${
          isDragging 
            ? "border-yellow-400 bg-yellow-400/5 scale-[1.02]" 
            : "border-neutral-700 bg-neutral-900/50 hover:border-neutral-500 hover:bg-neutral-800/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); setIsExtracted(true); }}
      >
        <div className="mb-4 rounded-full bg-neutral-800 p-4 shadow-inner">
          <UploadCloud className="h-8 w-8 text-yellow-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Drag & Drop a PDF or Image</h3>
        <p className="mt-2 text-sm text-white/50 max-w-sm text-center">
          We'll analyze the file locally and extract all embedded and referenced fonts instantly.
        </p>
        <div className="mt-6 flex items-center gap-4">
          <button 
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-2.5 text-xs font-bold text-black hover:bg-yellow-300 transition-colors shadow-[0_0_15px_rgba(250,204,21,0.2)]"
            onClick={() => setIsExtracted(true)}
          >
            <FolderOpen className="w-4 h-4" /> Browse Files
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className={`flex flex-col gap-4 transition-all duration-500 ${isExtracted ? "opacity-100 translate-y-0" : "opacity-50 translate-y-4"}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-wider text-white uppercase">
            Extracted Fonts
          </h3>
          <span className="text-xs font-medium text-white/40">
            {isExtracted ? "3 fonts found" : "Waiting for file..."}
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-neutral-900/80 text-xs uppercase text-white/40 border-b border-neutral-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Font Name</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Weight</th>
                <th className="px-6 py-4 font-semibold">Embedded</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {isExtracted ? extractedFonts.map((font, idx) => (
                <tr key={idx} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <FileType className="w-4 h-4 text-white/30" />
                    {font.name}
                  </td>
                  <td className="px-6 py-4">{font.type}</td>
                  <td className="px-6 py-4">{font.weight}</td>
                  <td className="px-6 py-4">
                    {font.embedded ? (
                      <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/20">Yes</span>
                    ) : (
                      <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/20">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="flex items-center justify-end gap-1.5 w-full text-yellow-400 hover:text-yellow-300 font-semibold text-xs">
                      <Save className="w-3.5 h-3.5" /> Export .ttf
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/30">
                    Upload a file to see extracted fonts here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
