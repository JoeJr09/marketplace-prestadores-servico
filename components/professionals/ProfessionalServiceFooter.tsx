import Link from "next/link";

export function ProfessionalServiceFooter() {
  return (
    <footer className="mt-8 rounded-[2rem] bg-brand-steel-mid px-6 py-8 text-white sm:px-8 lg:px-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-lg font-black tracking-[-0.03em]">ACODE AQUI</p>
          <p className="mt-3 text-sm uppercase tracking-[0.18em] text-white/65">
            © 2026 Acode Aqui. Todos os direitos reservados.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] uppercase tracking-[0.22em] text-white/72">
          <Link href="#">Encontrar prestador</Link>
          <Link href="#">Oferecer serviços</Link>
          <Link href="#">Encontre clientes</Link>
          <Link href="#">Central de ajuda</Link>
          <Link href="#">Termos</Link>
          <Link href="#">Privacidade</Link>
        </div>
      </div>
    </footer>
  );
}
