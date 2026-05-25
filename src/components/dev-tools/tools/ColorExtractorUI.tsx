import { Image as ImageIcon, Copy, FolderOpen } from "lucide-react";
import { useState } from "react";

export default function ColorExtractorUI() {
  const [isDragging, setIsDragging] = useState(false);
  const [extractedColors] = useState([
    { hex: "#FACC15", rgb: "rgb(250, 204, 21)", hsl: "hsl(48, 96%, 53%)" },
    { hex: "#0A0A0A", rgb: "rgb(10, 10, 10)", hsl: "hsl(0, 0%, 4%)" },
    { hex: "#262626", rgb: "rgb(38, 38, 38)", hsl: "hsl(0, 0%, 15%)" },
    { hex: "#EF4444", rgb: "rgb(239, 68, 68)", hsl: "hsl(0, 84%, 60%)" },
    { hex: "#3B82F6", rgb: "rgb(59, 130, 246)", hsl: "hsl(217, 91%, 60%)" }
  ]);
  const [isExtracted, setIsExtracted] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (hex: string, index: number) => {
    navigator.clipboard.writeText(hex);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

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
          <ImageIcon className="h-8 w-8 text-yellow-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Upload an Image</h3>
        <p className="mt-2 text-sm text-white/50 max-w-sm text-center">
          Drop any JPG, PNG, or WebP here. We'll extract the dominant colors and generate a complete palette.
        </p>
        <div className="mt-6 flex items-center gap-4">
          <button 
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-2.5 text-xs font-bold text-black hover:bg-yellow-300 transition-colors shadow-[0_0_15px_rgba(250,204,21,0.2)]"
            onClick={() => setIsExtracted(true)}
          >
            <FolderOpen className="w-4 h-4" /> Browse Image
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className={`flex flex-col gap-6 transition-all duration-500 ${isExtracted ? "opacity-100 translate-y-0" : "opacity-50 translate-y-4"}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-wider text-white uppercase">
            Extracted Palette
          </h3>
          <span className="text-xs font-medium text-white/40">
            {isExtracted ? "5 dominant colors found" : "Waiting for image..."}
          </span>
        </div>

        {isExtracted ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {extractedColors.map((color, idx) => (
              <div 
                key={idx} 
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md transition-all duration-300 hover:border-neutral-700 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Color Swatch block */}
                <div 
                  className="h-28 w-full transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundColor: color.hex }}
                />
                
                {/* Color details */}
                <div className="flex flex-col p-4 gap-1.5 z-10 bg-neutral-900">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-white tracking-wide">
                      {color.hex}
                    </span>
                    <button 
                      onClick={() => handleCopy(color.hex, idx)}
                      className="text-white/40 hover:text-white transition-colors"
                      title="Copy HEX"
                    >
                      {copiedIndex === idx ? (
                        <span className="text-green-400 text-[10px] uppercase font-bold">Copied</span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="font-mono text-[10px] text-white/40">{color.rgb}</span>
                  <span className="font-mono text-[10px] text-white/40">{color.hsl}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
            <span className="text-white/30 text-sm">Upload an image to see the color palette here.</span>
          </div>
        )}
      </div>
    </div>
  );
}
