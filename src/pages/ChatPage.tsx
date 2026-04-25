import { useEffect, useRef, useState } from "react"
import { PixelSprite } from "@/components/PixelSprite"
import { AltMessagePart } from "@/components/AltMessageParts"
import { matchAltResponse, type AltMsgPart } from "@/lib/mockData"

type ChatMsg =
  | { from: "user"; text: string }
  | { from: "alt"; text: string; parts?: AltMsgPart[] }

const PROMPTS = [
  "What should I prioritize today?",
  "Why is Marcus flagged?",
  "Should I shortlist Priya?",
  "Am I being too strict on systems thinking?",
  "Draft a rejection for Tom",
  "Export this week's decisions",
]

export function ChatPage() {
  const [input, setInput] = useState("")
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [msgs])

  useEffect(() => { inputRef.current?.focus() }, [])

  const send = (override?: string) => {
    const msg = (override ?? input).trim()
    if (!msg) return
    setMsgs(p => [...p, { from: "user", text: msg }])
    setInput("")
    setTimeout(() => {
      const reply = matchAltResponse(msg)
      setMsgs(p => [...p, { from: "alt", text: reply.text, parts: reply.parts }])
    }, 600)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="border-b border-border shrink-0">
        <div className="max-w-4xl mx-auto px-8 py-4 flex items-center gap-3">
          <div className="border border-border bg-muted/30 p-1.5">
            <PixelSprite size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Sashank's Alt</p>
            <p className="text-[11px] font-pixel text-muted-foreground">Thinking partner · trained on your decisions</p>
          </div>
          <span className="text-[10px] font-pixel text-muted-foreground">⌘K anywhere</span>
        </div>
      </div>

      <div ref={bodyRef} className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-6 flex flex-col gap-3 min-h-full">
          {msgs.length === 0 ? (
            <>
              <div className="text-sm leading-relaxed bg-muted/60 border border-border px-4 py-3 max-w-[80%]">
                Morning, Sashank. I've read the queue and can reason across your past decisions, the active candidates, and the memories you've taught me. What's on your mind?
              </div>
              <p className="text-[10px] font-pixel uppercase tracking-[0.12em] text-muted-foreground mt-4 mb-1">Try asking</p>
              <div className="flex flex-wrap gap-2">
                {PROMPTS.map(p => (
                  <button key={p} onClick={() => send(p)}
                    className="text-left text-xs font-pixel px-3 py-2 border border-border bg-muted/30 hover:bg-muted/60 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            </>
          ) : (
            msgs.map((m, i) => {
              if (m.from === "user") {
                return (
                  <div key={i} className="text-sm leading-relaxed px-3 py-2.5 max-w-[75%] bg-foreground text-background self-end">
                    {m.text}
                  </div>
                )
              }
              return (
                <div key={i} className="flex flex-col gap-2 max-w-[75%] self-start w-full">
                  <div className="text-sm leading-relaxed px-3 py-2.5 bg-muted/60 border border-border">
                    {m.text}
                  </div>
                  {m.parts && m.parts.length > 0 && (
                    <div className="flex flex-col gap-2 pl-1">
                      {m.parts.map((part, pi) => (
                        <AltMessagePart key={pi} part={part} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="border-t border-border shrink-0">
        <div className="max-w-4xl mx-auto px-8 py-3 flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") send() }}
            placeholder="Ask your Alt anything..."
            className="flex-1 text-sm border border-border px-3 py-2 bg-background outline-none placeholder:text-muted-foreground focus:border-foreground/40"
          />
          <button onClick={() => send()} disabled={!input.trim()}
            className="text-sm font-pixel px-4 py-2 bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition-opacity">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
