import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/apiAuth";
import { invalider } from "@/lib/emailsConfiguration";
import { normaliserAdresse } from "@/lib/emailsEvenements";

function identifiant(valeur: string): number | null {
  const id = Number(valeur);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Modifie l'adresse d'une ligne ; l'email et le type de destinataire ne changent pas. */
export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/emails-destinataires/[id]">
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const id = identifiant((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });

  const corps = await request.json().catch(() => null);
  const adresse = normaliserAdresse(corps?.adresse);
  if (!adresse) {
    return NextResponse.json({ error: "Cette adresse email n'est pas valide." }, { status: 400 });
  }

  try {
    const ligne = await prisma.emails_destinataires.update({
      where: { id },
      data: { adresse },
      select: { id: true, evenement: true, mode: true, adresse: true },
    });
    invalider();
    return NextResponse.json(ligne);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "Cette adresse est déjà dans la liste." }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Adresse introuvable." }, { status: 404 });
      }
    }
    console.error("Erreur modification d'un destinataire d'email :", error);
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}

/** Retire une adresse. Retirer la dernière d'une liste rétablit son repli d'environnement, s'il existe. */
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/emails-destinataires/[id]">
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const id = identifiant((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });

  try {
    await prisma.emails_destinataires.delete({ where: { id } });
    invalider();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Adresse introuvable." }, { status: 404 });
    }
    console.error("Erreur suppression d'un destinataire d'email :", error);
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}
