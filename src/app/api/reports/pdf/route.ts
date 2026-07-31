import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { auth } from "@/auth";
import {
  getPeriodReport,
  parseReportPeriod,
  parseReportRef,
} from "@/lib/reports";
import { buildReportPdf } from "@/lib/report-pdf";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const period = parseReportPeriod(searchParams.get("period") || undefined);
  const ref = parseReportRef(searchParams.get("ref") || undefined);
  const report = await getPeriodReport(period, ref);
  const pdf = await buildReportPdf(report);

  const stamp = format(ref, "yyyy-MM-dd");
  const filename = `Rapport_${period}_${stamp}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
