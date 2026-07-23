"use client";

import Image from "next/image";
import { useState } from "react";
import { brandAssets } from "@/lib/brand-assets";

export function BrandGallery() {
  const [active, setActive] = useState<string | null>(null);
  const selected = brandAssets.gallery.find((g) => g.src === active);

  return (
    <>
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
        {brandAssets.gallery.map((item, index) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setActive(item.src)}
            className="group mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <span className="relative block aspect-[3/4] overflow-hidden">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-brand-deep"
            onClick={() => setActive(null)}
          >
            Fermer
          </button>
          <div
            className="relative h-[80vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selected.src}
              alt={selected.alt}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
