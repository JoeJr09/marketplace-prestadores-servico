import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-acode-footer text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div>
          <Link
            href="/"
            className="text-xl font-black tracking-[-0.04em] text-white"
          >
            Acode Aqui
          </Link>
          <p className="mt-3 text-xs uppercase tracking-[0.22em] text-white/64">
            © 2024 Acode Aqui. Todos os direitos reservados.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-9 gap-y-4 text-xs uppercase tracking-[0.28em] text-white/58">
          <Link href="/prestador" className="transition hover:text-white">
            Encontrar prestador
          </Link>
          <Link
            href="/register/professional"
            className="transition hover:text-white"
          >
            Oferecer serviços
          </Link>
          <Link href="/cliente" className="transition hover:text-white">
            Encontre clientes
          </Link>
          <Link href="/login" className="transition hover:text-white">
            Central de ajuda
          </Link>
        </nav>
      </div>
    </footer>
  );
}
