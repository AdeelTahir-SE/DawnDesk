import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"



export default function AI(){
    const [message, setMessage] = useState<string>("")
    const [response, setResponse] = useState<string>("this is response")
    const [logs, setLogs] = useState<string[]>([])

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

    return(
        <div className="text-white flex flex-col items-center justify-center w-full gap-[30px]">
            <p className="w-full text-4xl">{response}</p>
            <input className="text-black" type="text" value={message} onChange={(e)=>setMessage(e.target.value)} />
            <button onClick={getChat}>Send</button>
            <div className="w-full max-w-3xl bg-black/40 p-3 rounded text-sm">
                <p className="font-semibold mb-2">Model Logs</p>
                <div className="max-h-48 overflow-auto space-y-1">
                    {logs.map((line, index) => (
                        <p key={index} className="font-mono">{line}</p>
                    ))}
                </div>
            </div>
        </div>
    )
}