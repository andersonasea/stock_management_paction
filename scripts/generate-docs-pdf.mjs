/**
 * Génère le manuel utilisateur et la note d'explication EsthyPyaourt (PDF).
 * Usage: node scripts/generate-docs-pdf.mjs
 */
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "docs");
fs.mkdirSync(OUT_DIR, { recursive: true });

const BRAND = "#1a3a8f";
const MUTED = "#555555";
const SITE = "https://esthypyaourt.vercel.app";

function createDoc(fileName, title) {
  const filePath = path.join(OUT_DIR, fileName);
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 56, bottom: 56, left: 56, right: 56 },
    info: {
      Title: title,
      Author: "P.Aktion / EsthyPyaourt",
      Subject: title,
    },
  });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  return { doc, stream, filePath };
}

function header(doc, title, subtitle) {
  doc
    .fillColor(BRAND)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("EsthyPyaourt", { continued: false });
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(10)
    .text("Produit P.Aktion — Kinshasa")
    .moveDown(0.6);
  doc
    .fillColor(BRAND)
    .font("Helvetica-Bold")
    .fontSize(16)
    .text(title)
    .moveDown(0.3);
  if (subtitle) {
    doc.fillColor(MUTED).font("Helvetica").fontSize(10).text(subtitle).moveDown(0.8);
  } else {
    doc.moveDown(0.5);
  }
  doc
    .strokeColor("#cccccc")
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke()
    .moveDown(1);
}

function h2(doc, text) {
  doc.moveDown(0.6);
  doc.fillColor(BRAND).font("Helvetica-Bold").fontSize(13).text(text).moveDown(0.35);
}

function h3(doc, text) {
  doc.moveDown(0.35);
  doc.fillColor("#222222").font("Helvetica-Bold").fontSize(11).text(text).moveDown(0.25);
}

function p(doc, text) {
  doc.fillColor("#222222").font("Helvetica").fontSize(10).text(text, {
    align: "justify",
    lineGap: 2,
  });
  doc.moveDown(0.35);
}

function bullet(doc, text) {
  doc.fillColor("#222222").font("Helvetica").fontSize(10).text(`•  ${text}`, {
    indent: 8,
    lineGap: 1.5,
  });
}

function footer(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.height - 36;
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(8)
      .text(
        `EsthyPyaourt — ${SITE}  |  Page ${i - range.start + 1}/${range.count}`,
        doc.page.margins.left,
        bottom,
        {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          align: "center",
        }
      );
  }
}

function waitEnd(stream) {
  return new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

async function generateManuel() {
  const { doc, stream, filePath } = createDoc(
    "Manuel_Utilisateur_EsthyPyaourt.pdf",
    "Manuel utilisateur EsthyPyaourt"
  );
  doc.bufferPages = true;

  header(
    doc,
    "Manuel utilisateur",
    `Application de gestion de stock et de commandes — ${SITE}`
  );

  h2(doc, "1. Introduction");
  p(
    doc,
    "Ce manuel décrit comment utiliser l'application EsthyPyaourt selon votre rôle : Client, Administrateur ou Super Administrateur. L'application permet de commander des yaourts en ligne, de gérer le stock, les matières premières, la production et le suivi financier (marge et bénéfice)."
  );

  h2(doc, "2. Accès et comptes");
  bullet(doc, `Site web : ${SITE}`);
  bullet(doc, "WhatsApp commandes : +243 813 808 744");
  doc.moveDown(0.3);
  h3(doc, "Comptes de démonstration");
  bullet(doc, "Super Admin : superadmin@esthypyaourt.com / Admin123!");
  bullet(doc, "Admin : admin@esthypyaourt.com / Admin123!");
  bullet(doc, "Client : client@esthypyaourt.com / User123!");
  doc.moveDown(0.3);
  p(
    doc,
    "Pour créer un compte client : page « Créer un compte » (nom, email, téléphone, mot de passe)."
  );

  h2(doc, "3. Guide Client");
  h3(doc, "3.1 Parcourir le catalogue");
  bullet(doc, "Ouvrir Catalogue dans le menu.");
  bullet(doc, "Consulter les produits (saveurs, formats, prix, stock).");
  h3(doc, "3.2 Passer une commande");
  bullet(doc, "Se connecter avec un compte Client.");
  bullet(doc, "Choisir la quantité, renseigner téléphone et adresse.");
  bullet(doc, "Envoyer la commande — statut initial : En attente.");
  h3(doc, "3.3 Suivre ses commandes");
  bullet(doc, "Menu « Mes commandes ».");
  bullet(doc, "Statuts : En attente → Validée → Livrée (ou Annulée).");
  h3(doc, "3.4 Commander via WhatsApp");
  bullet(doc, "Depuis l'accueil, bouton « Commander sur WhatsApp ».");

  h2(doc, "4. Guide Administrateur");
  p(
    doc,
    "Après connexion Admin, utiliser le menu latéral Admin. Le Super Admin a aussi accès à ces écrans."
  );

  h3(doc, "4.1 Tableau de bord (/admin)");
  bullet(doc, "Produits, commandes en attente, stock.");
  bullet(doc, "CA livré, marge brute, charges hors production, bénéfice net.");

  h3(doc, "4.2 Produits");
  bullet(doc, "Créer / modifier / supprimer (ou désactiver) un produit.");
  bullet(doc, "Renseigner prix de vente, photo, description.");
  bullet(
    doc,
    "Dans « Modifier » : définir la Recette (nomenclature) — quantité de chaque matière pour 1 unité."
  );

  h3(doc, "4.3 Saveurs et Formats");
  bullet(doc, "Gérer les saveurs (ex. Vanille, Arachide) et formats (250 ml, 500 ml).");

  h3(doc, "4.4 Matières premières");
  bullet(doc, "Créer, modifier ou supprimer/désactiver une matière.");
  bullet(doc, "Consulter stock, CUMP et valeur du stock.");

  h3(doc, "4.5 Achats");
  bullet(doc, "Enregistrer un achat (matière, quantité, prix unitaire).");
  bullet(doc, "Le stock augmente et le CUMP est recalculé automatiquement.");

  h3(doc, "4.6 Stock / Production");
  bullet(doc, "Lancer une production : le système consomme les matières selon la recette.");
  bullet(doc, "Le stock produit fini augmente ; le coût de revient unitaire est calculé.");
  bullet(doc, "Sans recette ou sans stock matière suffisant, la production est refusée.");

  h3(doc, "4.7 Charges hors production");
  bullet(doc, "Saisir livraison, commercial, administratif ou autre.");
  bullet(doc, "Ces charges entrent dans le calcul du bénéfice net (pas dans le coût de production).");

  h3(doc, "4.8 Commandes");
  bullet(doc, "Valider une commande en attente (contrôle de stock).");
  bullet(doc, "Livrer une commande validée (décrément du stock produits finis).");
  bullet(doc, "Annuler si nécessaire (sauf déjà livrée).");

  h2(doc, "5. Guide Super Administrateur");
  bullet(doc, "Dashboard Super Admin : KPIs clients, admins, CA, marge, bénéfice, délais.");
  bullet(doc, "Tendances : évolution des commandes (jour / semaine / mois / année).");
  bullet(doc, "Gestion des admins : créer, modifier, supprimer ou rétrograder.");

  h2(doc, "6. Circuit recommandé (fabrication)");
  p(doc, "Ordre logique d'utilisation au quotidien :");
  bullet(doc, "1. Créer / mettre à jour les matières premières.");
  bullet(doc, "2. Enregistrer les achats (réapprovisionnement).");
  bullet(doc, "3. Vérifier les recettes sur chaque produit.");
  bullet(doc, "4. Lancer la production.");
  bullet(doc, "5. Traiter les commandes (valider puis livrer).");
  bullet(doc, "6. Saisir les charges (livraison, loyer, etc.).");
  bullet(doc, "7. Consulter le dashboard (marge / bénéfice).");

  h2(doc, "7. Bonnes pratiques");
  bullet(doc, "Ne pas supprimer une matière déjà utilisée : elle sera désactivée pour garder l'historique.");
  bullet(doc, "Toujours définir une recette avant de produire.");
  bullet(doc, "Le coût de revient se met à jour à chaque lot de production.");
  bullet(doc, "Les prix et coûts sont en CDF (Franc congolais).");

  h2(doc, "8. Assistance");
  p(
    doc,
    "Pour toute question opérationnelle : WhatsApp +243 813 808 744 — marque @esthypyaourt — P.Aktion, Kinshasa."
  );

  footer(doc);
  doc.end();
  await waitEnd(stream);
  return filePath;
}

async function generateNote() {
  const { doc, stream, filePath } = createDoc(
    "Note_Explication_EsthyPyaourt.pdf",
    "Note d'explication EsthyPyaourt"
  );
  doc.bufferPages = true;

  header(
    doc,
    "Note d'explication de l'application",
    "Présentation fonctionnelle, métier et technique — EsthyPyaourt / P.Aktion"
  );

  h2(doc, "1. Objet du document");
  p(
    doc,
    "Cette note présente l'application EsthyPyaourt : son objectif, les acteurs, le périmètre fonctionnel, le modèle de coût de revient (niveau comptable simplifié mais réaliste) et l'architecture technique. Elle complète le manuel utilisateur."
  );

  h2(doc, "2. Contexte et objectif");
  p(
    doc,
    "EsthyPyaourt est un produit P.Aktion (Kinshasa) : yaourts vanille et arachide, formats 250 ml et 500 ml. L'application digitalise la prise de commandes, le suivi de stock, la fabrication à partir de matières premières, et le pilotage de la marge / du bénéfice."
  );
  bullet(doc, `URL de production : ${SITE}`);
  bullet(doc, "Canal complémentaire : WhatsApp +243 813 808 744");

  h2(doc, "3. Acteurs et droits");
  bullet(doc, "Client (USER) : inscription, catalogue, commande, suivi de ses commandes.");
  bullet(
    doc,
    "Administrateur (ADMIN) : produits, matières, achats, production, charges, validation/livraison des commandes."
  );
  bullet(
    doc,
    "Super Administrateur (SUPER_ADMIN) : KPIs globaux, tendances, gestion des admins, + accès Admin."
  );

  h2(doc, "4. Périmètre fonctionnel");
  h3(doc, "4.1 Vitrine et ventes");
  bullet(doc, "Page d'accueil marque (visuels, vidéo, galerie, CTA WhatsApp).");
  bullet(doc, "Catalogue produits actifs avec commande en ligne.");
  bullet(doc, "Cycle de commande : En attente → Validée → Livrée / Annulée.");

  h3(doc, "4.2 Référentiel produit");
  bullet(doc, "Saveurs et formats dynamiques.");
  bullet(doc, "Produits = couple saveur × format, avec prix de vente et stock fini.");

  h3(doc, "4.3 Approvisionnement et fabrication");
  bullet(doc, "Stock de matières premières (unité L / kg / pièce).");
  bullet(doc, "Achats fournisseurs → entrée de stock.");
  bullet(doc, "Nomenclature (recette) par produit.");
  bullet(doc, "Production : consommation MP + entrée stock produit fini.");

  h3(doc, "4.4 Pilotage financier");
  bullet(doc, "Coût de revient de production calculé automatiquement.");
  bullet(doc, "Charges hors production classées (distribution, commercial, administratif, autre).");
  bullet(doc, "Tableaux de bord : CA livré, marge brute, bénéfice net.");

  h2(doc, "5. Modèle de coût (comptabilité de gestion)");
  p(
    doc,
    "L'application ne remplace pas une comptabilité en partie double, mais applique les principes du coût de revient de fabrication :"
  );
  h3(doc, "5.1 CUMP (coût unitaire moyen pondéré)");
  p(
    doc,
    "À chaque achat de matière : CUMP = (stock avant × CUMP avant + quantité achetée × prix d'achat) / stock après."
  );
  h3(doc, "5.2 Coût de production unitaire");
  p(
    doc,
    "Pour un produit : somme (quantité matière dans la recette × CUMP de la matière). Ce coût est figé sur le lot de production et mis à jour sur la fiche produit. Lors d'une commande, le coût est également snapshoté sur la ligne de commande."
  );
  h3(doc, "5.3 Marge et bénéfice");
  bullet(
    doc,
    "Marge brute = Σ (prix de vente − coût de production) × quantité, sur les commandes livrées."
  );
  bullet(doc, "Bénéfice net = marge brute − total des charges hors production.");
  p(
    doc,
    "Les matières premières ne sont pas saisies comme « charges » : elles transitent par les achats et la consommation en production. Les frais de livraison, marketing et admin restent hors coût de production."
  );

  h2(doc, "6. Flux métier résumé");
  p(
    doc,
    "Achat MP → Stock matières (CUMP) → Recette produit → Production (consommation + coût) → Stock fini → Commande client → Validation → Livraison (sortie stock) → Marge / bénéfice."
  );

  h2(doc, "7. Architecture technique");
  bullet(doc, "Frontend / Backend : Next.js 16 (App Router), React 19, TypeScript.");
  bullet(doc, "UI : Tailwind CSS 4.");
  bullet(doc, "Base de données : PostgreSQL (Supabase) via Prisma ORM.");
  bullet(doc, "Authentification : Auth.js (NextAuth v5), identifiants email/mot de passe.");
  bullet(doc, "Graphiques Super Admin : Recharts.");
  bullet(doc, "Validation des formulaires : Zod.");
  bullet(doc, "Hébergement type : Vercel + base Supabase (connection pooling).");

  h2(doc, "8. Limites actuelles");
  bullet(doc, "Pas de grand livre / écritures comptables en partie double.");
  bullet(
    doc,
    "La main-d'œuvre et les frais généraux de fabrication ne sont pas ventilés automatiquement sur chaque unité (peuvent être saisis en charges)."
  );
  bullet(doc, "Pas de multi-entrepôt ni de gestion multi-devises.");

  h2(doc, "9. Conclusion");
  p(
    doc,
    "EsthyPyaourt fournit un outil opérationnel complet pour vendre, fabriquer et piloter la rentabilité d'une petite unité de production de yaourts à Kinshasa, avec un modèle de coût de revient aligné sur les bonnes pratiques de comptabilité de gestion."
  );

  footer(doc);
  doc.end();
  await waitEnd(stream);
  return filePath;
}

(async () => {
  const a = await generateManuel();
  const b = await generateNote();
  console.log("OK");
  console.log(a);
  console.log(b);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
