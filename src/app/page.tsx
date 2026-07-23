import Image from "next/image";
import Link from "next/link";
import { BrandGallery } from "@/components/BrandGallery";
import { brandAssets, WHATSAPP_URL } from "@/lib/brand-assets";

export default function HomePage() {
  return (
    <div>
      {/* Hero plein écran */}
      <section className="relative min-h-[88vh] overflow-hidden">
        <Image
          src={brandAssets.heroVanille}
          alt="EsthyPyaourt — une vague de douceur, saveur vanille"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f2666]/88 via-[#1a3a8f]/55 to-transparent" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-4 py-16 text-white">
          <p className="animate-rise text-sm font-semibold tracking-[0.2em] uppercase text-white/80">
            P.Aktion · Kinshasa
          </p>
          <h1 className="animate-rise mt-3 font-[family-name:var(--font-display)] text-5xl leading-tight sm:text-7xl">
            EsthyPyaourt
          </h1>
          <p className="animate-rise mt-4 max-w-xl text-lg text-white/90 sm:text-xl [animation-delay:120ms]">
            La fraîcheur qui fait du bien — vanille & arachide, 250 ml et 500 ml.
            Livraison partout à Kinshasa.
          </p>
          <div className="animate-rise mt-8 flex flex-wrap gap-3 [animation-delay:220ms]">
            <Link href="/catalogue" className="btn btn-primary">
              Voir le catalogue
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn border border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              Commander sur WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Produit + lifestyle */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center">
        <div className="animate-rise">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-brand sm:text-4xl">
            Naturel & savoureux
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            EsthyPyaourt est un produit P.Aktion : onctueux, frais et naturel.
            Idéal pour toute la famille — disponible en saveur vanille et
            arachide.
          </p>
          <ul className="mt-6 space-y-2 text-sm font-semibold text-brand-deep">
            <li>• Saveurs : Vanille · Arachide</li>
            <li>• Formats : 250 ml · 500 ml</li>
            <li>• Livraison à domicile à Kinshasa</li>
            <li>• WhatsApp +243 813 808 744</li>
          </ul>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-2xl animate-float">
          <Image
            src={brandAssets.lifestyleEsthy}
            alt="EsthyPYaourt 250 ml vanille"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* Vidéo marque */}
      <section className="bg-brand-deep/5 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 text-center">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-brand sm:text-4xl">
              En motion
            </h2>
            <p className="mt-2 text-muted">
              Découvrez l&apos;univers EsthyPyaourt en vidéo
            </p>
          </div>
          <div className="overflow-hidden rounded-[1.5rem] shadow-2xl ring-1 ring-border">
            <video
              className="aspect-video w-full bg-black object-cover"
              controls
              playsInline
              preload="metadata"
              poster={brandAssets.promoSaveurs}
            >
              <source src={brandAssets.video} type="video/mp4" />
              Votre navigateur ne prend pas en charge la vidéo.
            </video>
          </div>
        </div>
      </section>

      {/* Saveurs côte à côte */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-brand sm:text-4xl">
            Deux saveurs, un plaisir
          </h2>
          <p className="mt-2 text-muted">Vanille & arachide — 250 ml et 500 ml</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
            <Image
              src={brandAssets.promoSaveurs}
              alt="EsthyPyaourt vanille et arachide"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
            <Image
              src={brandAssets.lifestyleArachide}
              alt="Saveur arachide EsthyPyaourt"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Livraison */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center">
        <div className="relative order-2 aspect-[4/3] overflow-hidden rounded-[2rem] md:order-1">
          <Image
            src={brandAssets.livraison}
            alt="Livraison EsthyPyaourt à domicile à Kinshasa"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="order-1 md:order-2">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-brand sm:text-4xl">
            Livraison à domicile
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            Un goût irrésistible livré à votre porte. Commandez en ligne ou sur
            WhatsApp — on s&apos;occupe du reste.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/catalogue" className="btn btn-primary">
              Commander maintenant
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Galerie */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-brand sm:text-4xl">
            Galerie
          </h2>
          <p className="mt-2 text-muted">
            L&apos;univers EsthyPyaourt — cliquez pour agrandir
          </p>
        </div>
        <BrandGallery />
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={brandAssets.promoPaques}
            alt="EsthyPyaourt — moments à partager"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#0f2666]/80" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center text-white">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl">
            Les meilleurs moments sont ceux qu&apos;on partage
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/90">
            Avec EsthyPyaourt, partagez le goût du naturel.
          </p>
          <Link href="/register" className="btn btn-primary mt-8 inline-flex">
            Créer un compte
          </Link>
        </div>
      </section>
    </div>
  );
}
