"use client";

import type { FormEvent } from "react";
import type { WeatherSearchInput } from "@/lib/types";

type WeatherSearchProps = {
  value: WeatherSearchInput;
  isLoading: boolean;
  onChange: (value: WeatherSearchInput) => void;
  onSubmit: () => void;
  onUseCurrentLocation: () => void;
};

export function WeatherSearch({
  value,
  isLoading,
  onChange,
  onSubmit,
  onUseCurrentLocation
}: WeatherSearchProps) {
  //just a form, user will fill it and submit it
  function updateField(field: keyof WeatherSearchInput, fieldValue: string) {
    onChange({ ...value, [field]: fieldValue });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="panel" aria-labelledby="search-title">
      <div className="panel-header">
        <h2 id="search-title">Weather Search</h2>
      </div>
      <form className="panel-body" onSubmit={handleSubmit}>
        <div className="search-grid">
          <div className="field full">
            <label htmlFor="mode">Search type</label>
            <select
              id="mode"
              value={value.mode}
              onChange={(event) =>
                onChange({
                  mode: event.target.value as WeatherSearchInput["mode"],
                  country: value.country
                })
              }
            >
              <option value="city">City name</option>
              <option value="zip">Postal code</option>
              <option value="coords">GPS coordinates</option>
            </select>
          </div>

          {value.mode === "city" && (
            <div className="field">
              <label htmlFor="city">City</label>
              <input
                id="city"
                placeholder="Toronto"
                value={value.city ?? ""}
                onChange={(event) => updateField("city", event.target.value)}
              />
            </div>
          )}

          {value.mode === "zip" && (
            <div className="field">
              <label htmlFor="zip">Postal code</label>
              <input
                id="zip"
                placeholder="10001"
                value={value.zip ?? ""}
                onChange={(event) => updateField("zip", event.target.value)}
              />
            </div>
          )}

          {value.mode !== "coords" && (
            <div className="field">
              <label htmlFor="country">Country code</label>
              <input
                id="country"
                placeholder="CA or US"
                value={value.country ?? ""}
                onChange={(event) => updateField("country", event.target.value.toUpperCase())}
                maxLength={2}
              />
            </div>
          )}

          {value.mode === "coords" && (
            <>
              <div className="field">
                <label htmlFor="lat">Latitude</label>
                <input
                  id="lat"
                  inputMode="decimal"
                  placeholder="43.6532"
                  value={value.lat ?? ""}
                  onChange={(event) => updateField("lat", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="lon">Longitude</label>
                <input
                  id="lon"
                  inputMode="decimal"
                  placeholder="-79.3832"
                  value={value.lon ?? ""}
                  onChange={(event) => updateField("lon", event.target.value)}
                />
              </div>
            </>
          )}

          <div className="field">
            <label htmlFor="startDate">Start date</label>
            <input
              id="startDate"
              type="date"
              value={value.startDate ?? ""}
              onChange={(event) => updateField("startDate", event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="endDate">End date</label>
            <input
              id="endDate"
              type="date"
              value={value.endDate ?? ""}
              onChange={(event) => updateField("endDate", event.target.value)}
            />
          </div>
        </div>

        <div className="actions">
          <button className="button" disabled={isLoading} type="submit">
            {isLoading ? "Searching..." : "Search weather"}
          </button>
          <button
            className="button secondary"
            disabled={isLoading}
            onClick={onUseCurrentLocation}
            type="button"
          >
            Use current location
          </button>
        </div>
      </form>
    </section>
  );
}
