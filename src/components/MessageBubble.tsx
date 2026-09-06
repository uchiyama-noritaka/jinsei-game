import type { Sender } from "../types";

export function MessageBubble({ from, text }: { from: Sender; text: string }) {
  if (from === "system") {
    return <div className="system-line">{text}</div>;
  }
  const isMe = from === "me";
  return (
    <div className={`bubble-row ${isMe ? "me" : "them"}`}>
      <div className="bubble">{text}</div>
    </div>
  );
}
