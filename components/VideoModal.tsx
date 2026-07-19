"use client";

import { useState } from "react";
import { videoEmbedUrl } from "@/lib/movementLibrary";

export default function VideoModal({
  title,
  initialUrl,
  editable,
  onClose,
  onSave,
}: {
  title: string;
  initialUrl: string;
  editable: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
}) {
  const [url, setUrl] = useState(initialUrl || "");
  const embed = videoEmbedUrl(url);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-5 z-50"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card w-full max-w-sm p-6" style={{ maxHeight: "86vh", overflowY: "auto" }}>
        <h3 className="text-white font-extrabold text-lg mb-1">🎥 {title}</h3>

        {!editable && !url && (
          <p className="text-sm" style={{ color: "#9a9a9f" }}>
            Nenhum vídeo adicionado ainda para este movimento. Peça pro seu coach anexar!
          </p>
        )}

        {url && embed && (
          <div className="mb-4">
            {embed.type === "link" ? (
              <a href={embed.embed} target="_blank" rel="noopener noreferrer" className="btn btn-gold inline-block">
                ▶ Abrir vídeo
              </a>
            ) : (
              <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 14, overflow: "hidden", background: "#000" }}>
                <iframe
                  src={embed.embed}
                  allowFullScreen
                  loading="lazy"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                />
              </div>
            )}
          </div>
        )}

        {editable && (
          <>
            <p className="text-sm mb-3" style={{ color: "#9a9a9f" }}>
              Cole o link do vídeo de referência (YouTube ou Vimeo).
            </p>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-3 py-2 rounded-lg text-sm font-semibold mb-4"
              style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" }}
            />
            <div className="flex gap-2">
              {url && (
                <button onClick={() => { setUrl(""); onSave(""); onClose(); }} className="btn flex-1" style={{ background: "#ef4444", borderColor: "#ef4444" }}>
                  Remover
                </button>
              )}
              <button onClick={() => { onSave(url.trim()); onClose(); }} className="btn btn-gold flex-1">
                Salvar vídeo
              </button>
            </div>
          </>
        )}

        {!editable && (
          <button onClick={onClose} className="btn w-full mt-2">Fechar</button>
        )}
      </div>
    </div>
  );
}
