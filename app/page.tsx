import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Header from "@/components/e/Header";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-navy text-white">
      <Header />

      <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[radial-gradient(circle_at_78%_74%,rgba(26,43,60,0.92)_0%,rgba(4,22,39,0.92)_36%,#041627_72%)]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,22,39,0.98)_0%,rgba(4,22,39,0.82)_42%,rgba(26,43,60,0.6)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(26,43,60,0.38))]" />

        <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-12 px-6 py-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-20">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-hero-silver">
              Our Blueprint
            </p>

            <h1 className="mt-7 text-6xl font-black leading-[0.96] tracking-[-0.07em] text-white sm:text-7xl lg:text-8xl">
              Built for
              <br />
              Precision.
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-brand-steel sm:text-xl sm:leading-9">
              Whether you&apos;re looking to hire the best or looking to grow
              your professional practice, Acode Aqui provides the structural
              integrity for modern service commerce.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="xl"
                className="rounded-md bg-brand-brown-rich px-8 font-black text-brand-orange hover:bg-brand-brown"
              >
                <Link href="/login/professional">
                  I&apos;m a Professional
                  <ArrowRight className="size-5" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="xl"
                className="rounded-md border-white bg-transparent px-8 font-black text-white hover:bg-white hover:text-brand-navy"
              >
                <Link href="/cliente">I&apos;m a Client</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-white/8 bg-hero-panel/82 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
              <div
                className="min-h-[420px] rounded-md bg-cover bg-center grayscale sm:min-h-[520px] lg:min-h-[550px]"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg,rgba(4,22,39,0.02),rgba(38,16,0,0.28)),url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1100&q=90)",
                }}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
