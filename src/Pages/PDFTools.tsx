import { invoke } from "@tauri-apps/api/core"
import { useState,useEffect } from "react"

type StorageData = {
  name: string;
  data_type: string;
  icon: string;
};

export default function PDFTools(){
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [showFileModal, setShowFileModal] = useState(false);

    const PDFTools=[
        {
            title:"PDF Merger",
            description:"Merge multiple PDF files into a single document."
        },
        {
            title:"PDF Splitter",
            description:"Split a PDF file into multiple smaller files based on page ranges."
        },
        {
            title:"PDF Compressor",
            description:"Reduce the file size of a PDF document while maintaining quality."
        },
        {
            title:"PDF Converter",
            description:"Convert PDF files to other formats such as Word, Excel, or images."
        },
        {   title:"PDF Editor",
            description:"Edit the content of PDF files, including text, images, and annotations."
        },
        {
            title:"PDF to Word Converter",
            description:"Convert PDF files to editable Word documents while preserving formatting.",
            function:"pdf_to_word"
        }
    ]
    return(
        <div className="p-8 flex flex-col items-center justify-center gap-[30px] w-full">
            <div className="w-full flex items-center justify-between">
                <div className="flex-1"></div>
                <button
                  className="rounded-lg bg-yellow-400 px-6 py-2.5 text-sm font-bold text-neutral-950 transition-colors duration-150 hover:bg-yellow-300 active:bg-yellow-500"
                  onClick={() => setShowFileModal(true)}
                  type="button"
                >
                  Select File
                </button>
            </div>

            {selectedFile && (
              <div className="w-full bg-neutral-800 p-4 rounded-lg border border-yellow-400/30">
                <p className="text-white/70 text-sm">Selected file:</p>
                <p className="text-white font-semibold text-lg">{selectedFile}</p>
                <button
                  className="mt-2 text-sm text-yellow-400 hover:text-yellow-300"
                  onClick={() => setSelectedFile(null)}
                >
                  Change
                </button>
              </div>
            )}

            {selectedFile ? (
              <div className="flex flex-row items-start justify-start flex-wrap gap-[20px] w-full">
                {PDFTools.map((tool,index)=>(
                    <PDFToolCard 
                      key={index} 
                      title={tool.title} 
                      description={tool.description}
                      onConvert={async() => {
                        if(tool.function){
                            try {
                                await invoke(tool.function, { path: selectedFile });
                                alert(`${tool.title} completed successfully! Check storage for file`);
                            } catch (error) {
                                console.error(`Error during ${tool.title}:`, error);
                                alert(`Error during ${tool.title}: ${error instanceof Error ? error.message : String(error)}`);
                            }
                        }
                      }}
                      showConvertBtn={true}
                    />
                ))}
              </div>
            ) : (
              <div className="text-center text-white/60">
                <p className="text-lg">Select a file to get started</p>
              </div>
            )}

            {showFileModal && (
              <SelectFileMenu 
                onFileSelected={(filePath) => {
                  setSelectedFile(filePath);
                  setShowFileModal(false);
                }}
                onClose={() => setShowFileModal(false)}
              />
            )}
        </div>
    )
}



function PDFToolCard({
  title,
  description,
  onClick,
  onConvert,
  showConvertBtn,
}: {
  title: string;
  description: string;
  onClick?: () => void;
  onConvert?: () => void;
  showConvertBtn?: boolean;
}) {
    return(
        <div 
          className="bg-neutral-800 p-4 rounded-md max-w-72 hover:bg-neutral-700 transition-colors duration-150 flex flex-col gap-3"
        >
            <div
              onClick={!showConvertBtn ? onClick : undefined}
              role={!showConvertBtn ? "button" : undefined}
              tabIndex={!showConvertBtn ? 0 : undefined}
              onKeyDown={(e) => {
                if (!showConvertBtn && (e.key === 'Enter' || e.key === ' ')) {
                  onClick?.();
                }
              }}
              className={!showConvertBtn ? "cursor-pointer" : ""}
            >
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-white/70">{description}</p>
            </div>
            {showConvertBtn && (
              <button
                onClick={onConvert}
                className="mt-2 w-full rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-neutral-950 transition-colors duration-150 hover:bg-yellow-300 active:bg-yellow-500"
              >
                Convert
              </button>
            )}
        </div>
    )
}


function SelectFileMenu({
  onFileSelected,
  onClose,
}: {
  onFileSelected: (filePath: string) => void;
  onClose: () => void;
}) {
    const [data,setData]=useState<StorageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(()=>{
        async function fetchData(){
            try {
                setLoading(true);
                setError(null);
                const result = await invoke<StorageData[]>("get_storage_data");
                console.log("Storage data received from Rust:", result);
                setData(result);
            } catch (error) {
                console.error("Error fetching storage data:", error);
                setError(error instanceof Error ? error.message : String(error));
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if(data.length===0 || loading){
        return(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Select file from storage</h2>
                  <button
                    onClick={onClose}
                    className="text-white/60 hover:text-white text-xl font-bold"
                  >
                    ×
                  </button>
                </div>

                {loading && <p className="text-white/70 py-4">Loading files...</p>}
                {error && <p className="text-red-400 py-4">Error: {error}</p>}
                {!loading && !error && (
                  <p className="text-white/70">No files found in storage.</p>
                )}
                
                <button
                  className="mt-6 w-full rounded-lg bg-neutral-700 px-5 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-neutral-600"
                  onClick={onClose}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
        );
    }
    else{
        return(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-2xl w-full max-h-96 mx-4 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Select file from storage</h2>
                  <button
                    onClick={onClose}
                    className="text-white/60 hover:text-white text-xl font-bold"
                  >
                    <img src="/sidebar/close.svg" alt="Close" className="h-6 w-6 filter invert" />
                  </button>
                </div>

                <div className="space-y-2">
                    {data.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => onFileSelected(file.name)}
                        className="w-full text-left bg-neutral-800 p-3 rounded-md hover:bg-neutral-700 transition-colors flex items-center gap-3"
                      >
                        <span className="text-xl">{file.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-white">{file.name}</p>
                          <p className="text-xs text-white/60">{file.data_type}</p>
                        </div>
                      </button>
                    ))}
                </div>

                <button
                  className="mt-6 w-full rounded-lg bg-neutral-700 px-5 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-neutral-600"
                  onClick={onClose}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
        );
     }
}
