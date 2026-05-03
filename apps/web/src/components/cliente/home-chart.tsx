"use client";

import { AreaChart } from "@/components/charts/area-chart";

export function ClientHomeChart({
  data,
}: {
  data: Array<{ date: string; spend: number; revenue: number }>;
}) {
  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-body-sm text-text-tertiary">
        Sem dados de performance ainda. Aguarde a primeira sync com Meta.
      </div>
    );
  }
  return (
    <AreaChart
      data={data}
      format="brl0"
      series={[
        { key: "spend", label: "Investido", color: "#3D5AFE" },
        { key: "revenue", label: "Retorno", color: "#4ADE80" },
      ]}
    />
  );
}
