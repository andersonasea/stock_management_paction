import { format } from "date-fns";
import { PeriodReportView } from "@/components/PeriodReportView";
import {
  getPeriodReport,
  parseReportPeriod,
  parseReportRef,
} from "@/lib/reports";

type Props = {
  searchParams: Promise<{ period?: string; ref?: string }>;
};

export default async function AdminReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const period = parseReportPeriod(params.period);
  const ref = parseReportRef(params.ref);
  const report = await getPeriodReport(period, ref);
  const refDate = format(ref, "yyyy-MM-dd");

  return (
    <PeriodReportView
      report={report}
      period={period}
      refDate={refDate}
      basePath="/admin/reports"
    />
  );
}
