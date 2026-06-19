"use client";

import { useCallback, useEffect, useState } from "react";
import { HistoryList } from "@/components/HistoryList";
import { WeatherDisplay } from "@/components/WeatherDisplay";
import { WeatherSearch } from "@/components/WeatherSearch";
import type {
  ApiError,
  WeatherHistoryRecord,
  WeatherPayload,
  WeatherSearchInput
} from "@/lib/types";

type WeatherResponse = {
  weather: WeatherPayload;
  record: WeatherHistoryRecord;
};

export function WeatherApp() {
  const [search, setSearch] = useState<WeatherSearchInput>({
    mode: "city",
    city: "Toronto",
    country: "CA"
  });
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [records, setRecords] = useState<WeatherHistoryRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    setError("");

    try {
      //get all weather search history records from supabase
      const response = await fetch("/api/history", { cache: "no-store" });
      const body = (await response.json()) as { records?: WeatherHistoryRecord[] } & ApiError;

      if (!response.ok) {
        throw new Error(body.error ?? "Failed to load history.");
      }

      setRecords(body.records ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load history.");
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function searchWeather() {
    setIsSearching(true);
    setError("");

    try {
      //pass the search paras to weather, weather will go fetch weather from openweather and store the log in supabase
      const response = await fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(search)
      });
      const body = (await response.json()) as WeatherResponse & ApiError;

      if (!response.ok) {
        throw new Error(body.error ?? "Failed to fetch weather.");
      }
      // once get the weather, set the weather as the payload of the weatherDisplay
      setWeather(body.weather);
      await loadHistory();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to fetch weather.");
    } finally {
      setIsSearching(false);
    }
  }

  function useCurrentLocation() {
    setError("");

    if (!("geolocation" in navigator)) {
      setError("Your browser does not support geolocation.");
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextSearch: WeatherSearchInput = {
          ...search,
          mode: "coords",
          lat: position.coords.latitude.toFixed(5),
          lon: position.coords.longitude.toFixed(5)
        };

        setSearch(nextSearch);
        setIsSearching(false);
      },
      () => {
        setError("Unable to access your current location.");
        setIsSearching(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <h1>MZ Weather</h1>
          <p>
            Search current conditions and a 5 day forecast by city, postal code, or coordinates.
            Every successful query is stored in Supabase and managed from history.
          </p>
        </div>
        <div className="status-pill">{records.length} saved queries</div>
      </header>

      <section className="info-band" aria-label="Assessment information">
        <div>
          <span>Full Stack Assessment</span>
          <strong>Candidate: Meng Zhao</strong>
          <a href="https://github.com/mzhao1996/mzhaoweather" target="_blank" rel="noopener noreferrer">
            GitHub Profile
          </a>
          <br/>
          <a href="https://www.linkedin.com/in/meng-zhao-a95ba0169" target="_blank" rel="noopener noreferrer">
            LinkedIn Profile
          </a>
          <p>
            please contact me if you have any questions about the assessment, I will be happy to answer your questions.
            if you needs my contact information, please reach out to me via LinkedIn
          </p>
        </div>
        <p>
          PMA description:
          The Product Manager Accelerator Program is designed to support PM professionals through every stage of their careers. From students looking for entry-level jobs to Directors looking to take on a leadership role, our program has helped over hundreds of students fulfill their career aspirations.
          Our Product Manager Accelerator community are ambitious and committed. Through our program they have learnt, honed and developed new PM and leadership skills, giving them a strong foundation for their future endeavors.
        </p>
      </section>

      <div className="grid">
        <div className="stack">
          <WeatherSearch
            value={search}
            isLoading={isSearching}
            onChange={setSearch}
            onSubmit={searchWeather}
            onUseCurrentLocation={useCurrentLocation}
          />
          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}
          <WeatherDisplay weather={weather} />
        </div>

        <HistoryList
          records={records}
          isLoading={isHistoryLoading}
          onSelect={(record) => setWeather(record.weather_data)}
          onRefresh={loadHistory}
          onError={setError}
        />
      </div>
    </main>
  );
}
