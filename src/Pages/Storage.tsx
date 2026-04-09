import { useRef, useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
export default function Storage() {
  const [isDragging, setIsDragging] = useState(false);
  const [data, setData] = useState([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const getData = async () => {
    try {
      const result = await invoke("get_storage_data");
      setData(result);
    } catch (error) {
      console.error("Error fetching storage data:", error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleFiles = (files: FileList | File[]) => {
    // Here you can add your upload logic, e.g., sending files to the backend or saving them locally.
  };

  if (!data) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-6 p-6">
        <div
          className={`rounded-3xl border-2 border-dashed p-8 transition-colors duration-200 sm:p-10 ${
            isDragging
              ? "border-yellow-400 bg-yellow-400/10"
              : "border-neutral-700 bg-neutral-900/50"
          }`}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
        >
          <div className="flex flex-col items-center justify-center gap-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-950 text-2xl text-yellow-300 shadow-lg shadow-black/20">
              +
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">
                Drag and drop files here
              </h2>
              <p className="max-w-xl text-sm text-white/60">
                Files will appear here after selection. Add your upload handler
                in this page when you are ready.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                className="rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-bold text-neutral-950 transition-colors duration-150 hover:bg-yellow-300 active:bg-yellow-500"
                onClick={() => inputRef.current?.click()}
                type="button"
              >
                Upload files
              </button>
              <input
                ref={inputRef}
                className="hidden"
                multiple
                onChange={(event) => {
                  if (event.target.files) {
                    handleFiles(event.target.files);
                  }
                }}
                type="file"
              />
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        {data.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
    );
  }
}
