import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { fetchWeather } from "@/lib/weather";
import type { WeatherSearchInput } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as WeatherSearchInput;
    const weather = await fetchWeather(input);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("weather_queries")
      .insert({
        location: weather.location,
        weather_data: weather
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      weather,
      record: data
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch weather." },
      { status: 400 }
    );
  }
}
