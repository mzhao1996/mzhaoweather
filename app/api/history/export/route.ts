import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const CSV_COLUMNS = ["id", "location", "queried_at", "updated_at", "weather_data"];

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("weather_queries")
      .select("*")
      .order("queried_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const csv = [
      CSV_COLUMNS.join(","),
      ...(data ?? []).map((record) =>
        [
          record.id,
          record.location,
          record.queried_at,
          record.updated_at,
          JSON.stringify(record.weather_data)
        ]
          .map(csvEscape)
          .join(",")
      )
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Disposition": `attachment; filename="weather-history.csv"`,
        "Content-Type": "text/csv; charset=utf-8"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export history." },
      { status: 500 }
    );
  }
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}
