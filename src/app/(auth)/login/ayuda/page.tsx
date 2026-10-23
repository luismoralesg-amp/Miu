import Link from "next/link";

export const metadata = { title: "Ayuda para entrar" };

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="display text-[40px] leading-[1.05] font-medium">Ayuda para entrar</h1>
      <ol className="flex list-decimal flex-col gap-3 pl-5 text-body">
        <li>Escribe tu correo completo de la UFM, el que termina en @ufm.edu.</li>
        <li>
          Busca el correo de MiU, también en la carpeta de spam. El código vence en 10 minutos.
        </li>
        <li>
          Si ya no tienes acceso a tu correo, la recuperación es presencial en el campus, con tu
          carné.
        </li>
      </ol>
      <p className="text-body text-fg-muted">
        ¿Sigues sin poder entrar? Escribe a Soporte MiU desde{" "}
        <a
          href="https://soporte.ufm.edu"
          className="underline underline-offset-4"
          rel="noopener noreferrer"
        >
          soporte.ufm.edu
        </a>
        .
      </p>
      <Link href="/login" className="self-start underline underline-offset-4">
        Volver a entrar
      </Link>
    </div>
  );
}
