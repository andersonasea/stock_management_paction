import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="relative min-h-[88vh] overflow-hidden">
        <Image
          src="/banner.jpg"
          alt="EsthyPyaourt — yaourt vanille"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#3b2418]/92 via-[#3b2418]/70 to-[#1a3a8f]/55" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-4 py-16 text-white">
          <p className="animate-rise text-sm font-semibold tracking-[0.2em] uppercase text-white/80">
            P.Aktion · Kinshasa
          </p>
          <h1 className="animate-rise mt-3 font-[family-name:var(--font-display)] text-5xl leading-tight sm:text-7xl">
            EsthyPyaourt
          </h1>
          <p className="animate-rise mt-4 max-w-xl text-lg text-white/90 sm:text-xl [animation-delay:120ms]">
            La fraîcheur qui fait du bien — vanille & arachide, 250 ml et 500 ml.
          </p>
          <div className="animate-rise mt-8 flex flex-wrap gap-3 [animation-delay:220ms]">
            <Link href="/catalogue" className="btn btn-primary">
              Voir le catalogue
            </Link>
            <Link
              href="/register"
              className="btn border border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center">
        <div className="animate-rise">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-brand sm:text-4xl">
            Naturel & savoureux
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            EthyP Yaourt est un produit entreprise P.Aktion offrant des services
            et des produits uniques qui répondent aux besoins de rafraîchissement
            de sa vaste clientèle. Idéal pour toute la famille.
          </p>
          <ul className="mt-6 space-y-2 text-sm font-semibold text-brand-deep">
            <li>• Saveurs : Vanille · Arachide</li>
            <li>• Formats : 250 ml (pratique) · 500 ml (gourmand)</li>
            <li>• Disponible à Kinshasa</li>
          </ul>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2em] shadow-2xl animate-float">
          <Image
            src="/esthy.jpg"
            alt="EsthyPyaourt — saveurs vanille et arachide"
            fill
            className="object-cover"
          />
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/visuel1.jpg"
            alt="Partage en famille avec EsthyPyaourt"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#0f2666]/75" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center text-white">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl">
            Les meilleurs moments sont ceux qu&apos;on partage
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/90">
            Avec EsthyPyaourt, partagez le goût du naturel. Commandez en ligne,
            on s&apos;occupe du reste.
          </p>
          <Link href="/catalogue" className="btn btn-primary mt-8 inline-flex">
            Commander maintenant
          </Link>
        </div>
      </section>
    </div>
  );
}
