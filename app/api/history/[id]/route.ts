import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("weather_queries")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ record: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load history record." },
      { status: 404 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const body = (await request.json()) as { location?: string; weather_data?: unknown };
    const update: Record<string, unknown> = {};

    if (body.location !== undefined) {
      if (!body.location.trim()) {
        return NextResponse.json({ error: "location cannot be empty." }, { status: 400 });
      }

      update.location = body.location.trim();
    }

    if (body.weather_data !== undefined) {
      update.weather_data = body.weather_data;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("weather_queries")
      .update(update)
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ record: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update history record." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("weather_queries").delete().eq("id", params.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete history record." },
      { status: 500 }
    );
  }
}
