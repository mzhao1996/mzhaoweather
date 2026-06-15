import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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

    return NextResponse.json({ records: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load history." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { location?: string; weather_data?: unknown };

    if (!body.location?.trim() || !body.weather_data) {
      return NextResponse.json(
        { error: "location and weather_data are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("weather_queries")
      .insert({
        location: body.location.trim(),
        weather_data: body.weather_data
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ record: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create history record." },
      { status: 500 }
    );
  }
}
