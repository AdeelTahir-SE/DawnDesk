import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { useLocation } from "react-router-dom"

export default function AI(){
    const [message, setMessage] = useState<string>("")
    const [response, setResponse] = useState<string>("this is response")
    const [logs, setLogs] = useState<string[]>([])
    const location = useLocation()

    useEffect(() => {
        const state = location.state as { initialPrompt?: string } | null;
        if (state?.initialPrompt) {
            setMessage(state.initialPrompt);
            // Clear location state in history so refreshing doesn't keep pre-filling the prompt
            window.history.replaceState({}, document.title);
        }
    }, [location.state])

    useEffect(() => {
        let unlisten: (() => void) | null = null

        const setup = async () => {
            unlisten = await listen<{ message?: string }>("ai://model-progress", (event) => {
                const msg = event.payload?.message ?? JSON.stringify(event.payload)
                setLogs((prev) => [...prev.slice(-49), msg])
            })
        }

        void setup()

        return () => {
            if (unlisten) {
                unlisten()
            }
        }
    }, [])

    async function getChat() {
        try {
            const result = await invoke<string>("generate_response", { input: message })
            setResponse(result)
            setMessage("")
        } catch (error) {
            const msg = String(error)
            setLogs((prev) => [...prev.slice(-49), msg])
        }
    }

    const lastLog = logs.length > 0 ? logs[logs.length - 1] : ""
    const downloadMatch = lastLog.match(/(\d+\.?\d*)%\s+done/)
    const downloadPercent = downloadMatch ? parseFloat(downloadMatch[1]) : 0

    return(
        <div className="text-white flex flex-col w-full gap-[20px] p-8">
            <div className="flex flex-col gap-[15px] max-w-3xl mx-auto w-full">
                <h1 className="text-4xl font-bold">AI Chat</h1>
                
                {/* Response Display */}
                {response && response !== "this is response" && (
                    <div className="bg-blue-900/30 border border-blue-500 p-4 rounded">
                        <p className="text-sm text-gray-300 mb-2">Response:</p>
                        <p className="text-lg">{response}</p>
                    </div>
                )}

                {/* Progress Logs - PROMINENT */}
                <div className="bg-gray-900 border-2 border-green-500 p-4 rounded">
                    <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-lg text-green-400">📥 Model Loading Progress</p>
                        <p className="text-sm text-gray-400">{logs.length} events</p>
                    </div>

                    {/* Visual Progress Bar */}
                    {downloadPercent > 0 && downloadPercent < 100 && (
                        <div className="mb-3">
                            <div className="w-full bg-gray-700 rounded h-2">
                                <div 
                                    className="bg-green-500 h-2 rounded transition-all"
                                    style={{ width: `${downloadPercent}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{downloadPercent.toFixed(1)}% downloaded</p>
                        </div>
                    )}

                    {/* Logs List */}
                    <div className="max-h-64 overflow-auto space-y-2 bg-black/50 p-3 rounded">
                        {logs.length === 0 ? (
                            <p className="text-gray-500 text-sm italic">Logs will appear here during download and loading...</p>
                        ) : (
                            logs.map((line, index) => (
                                <p key={index} className="font-mono text-xs text-gray-300 break-words">
                                    [{index + 1}] {line}
                                </p>
                            ))
                        )}
                    </div>
                </div>

                {/* Input and Button */}
                <div className="flex gap-3">
                    <input 
                        className="flex-1 text-black px-3 py-2 rounded"
                        type="text"
                        placeholder="Enter your message..."
                        value={message}
                        onChange={(e)=>setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && getChat()}
                    />
                    <button 
                        onClick={getChat}
                        className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    )
}