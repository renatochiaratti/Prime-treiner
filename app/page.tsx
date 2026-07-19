import Link from "next/link";

export default function GatePage() {
  return (
    <div className="app-shell flex items-center justify-center px-5" style={{ minHeight: "100vh" }}>
      <div className="w-full max-w-md text-center py-10">
        <div
          className="mx-auto mb-6 rounded-[22px] border border-white/15"
          style={{
            width: 76,
            height: 76,
            background: "#1f2024",
            boxShadow: "0 0 40px rgba(212,175,55,0.12), 0 0 60px rgba(34,197,94,0.10)",
          }}
        />
        <h1 className="font-display font-extrabold text-white" style={{ fontSize: 38, letterSpacing: "-0.02em" }}>
          PRIME TRAINER
        </h1>
        <div className="text-[15px] tracking-[0.3em] font-extrabold mt-1 mb-4" style={{ color: "#d4af37" }}>
          SEJA SUA MELHOR VERSÃO
        </div>
        <p className="text-sm mb-10" style={{ color: "#9a9a9f" }}>
          Seu treino. Sua evolução. <b style={{ color: "#22c55e" }}>Seu melhor.</b>
        </p>

        <div className="flex flex-col gap-3 text-left">
          <Link href="/coach/login" className="card flex items-center gap-4 p-5 hover:border-yellow-600/40">
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 44, height: 44, background: "#26272c", fontSize: 19 }}
            >
              🏋️
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-[15.5px]">Área do Coach</h3>
              <p className="text-xs" style={{ color: "#9a9a9f" }}>
                Faça login para editar treinos, marcas, aulas e recados dos seus alunos.
              </p>
            </div>
            <div style={{ color: "#6c6c72" }}>›</div>
          </Link>

          <div className="card p-5">
            <h3 className="font-bold text-white text-[15.5px] mb-1">Área do Aluno</h3>
            <p className="text-xs" style={{ color: "#9a9a9f" }}>
              Seu coach te envia um link pessoal (algo como{" "}
              <code style={{ color: "#d4af37" }}>/a/SEU-CODIGO</code>) — abra esse link direto,
              não precisa de senha.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
