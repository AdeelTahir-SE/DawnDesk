import { useRef, useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

type StorageData = {
  name: string;
  data_type: string;
  icon: string;
};

export default function Storage() {
  const [isDragging, setIsDragging] = useState(false);
  const [data, setData] = useState<StorageData[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const getData = async () => {
    if (!("__TAURI_INTERNALS__" in window)) {
      console.warn(
        "Tauri runtime not detected. Run this page via `npm run tauri dev`.",
      );
      return;
    }

    try {
      const result = await invoke<StorageData[]>("get_storage_data");
      console.log("Storage data received from Rust:", result);
      setData(result);
    } catch (error) {
      console.error("Error fetching storage data:", error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleFiles = async (_files: FileList | File[]) => {
    const firstFile = Array.from(_files)[0];
    if (!firstFile) {
      return;
    }

    const result = await invoke("create_file", {
      file: { name: firstFile.name, type: firstFile.type },
    });
    alert(result);
    getData(); // Refresh the storage data after uploading files.
    // Here you can add your upload logic, e.g., sending files to the backend or saving them locally.
  };

  if (data.length === 0) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-6 p-8">
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
      <div className="flex flex-col items-center justify-center w-full ">
        <div className="flex flex-row items-center justify-between  w-full px-8 pt-4">
          <p className="font-bold">App File Manager</p>
          <button
            className="rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-bold text-neutral-950 transition-colors duration-150 hover:bg-yellow-300 active:bg-yellow-500"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            Upload
          </button>
           <input
                ref={inputRef}
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) {
                    handleFiles(event.target.files);
                  }
                }}
                type="file"
              />
        </div>

        <div className="flex flex-col items-center justify-center w-full gap-[20px] p-8 ">
          {data.map((item, index) => (
            <StorageElement
              key={index}
              name={item.name}
              data_type={item.data_type}
              icon={item.icon}
            />
          ))}
        </div>
      </div>
    );
  }
}

function StorageElement({ name, data_type, icon }: StorageData) {
  return (
    <div className="w-full flex flex-row items-center justify-between rounded-lg bg-neutral-900/50 p-4">
      <div className="flex items-center gap-4 ">
        <img
          src="/file.svg"
          alt={`${name} icon`}
          className="h-8 w-8 filter invert"
        />
        <div>
          <div className="text-sm font-semibold text-white">{name}</div>
          <div className="text-xs text-white/60">{data_type}</div>
        </div>
      </div>
      <button>
        <img src="/delete.svg" alt="View" className="h-5 w-5 filter invert" />
      </button>
    </div>
  );
}
