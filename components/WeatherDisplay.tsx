"use client";

import Image from "next/image";
import { getIconUrl } from "@/lib/weather-icons";
import type { WeatherPayload } from "@/lib/types";

type WeatherDisplayProps = {
  weather: WeatherPayload | null;
};

export function WeatherDisplay({ weather }: WeatherDisplayProps) {
  //just use to display the weather, get the weather data from props
  if (!weather) {
    return (
      <section className="panel">
        <div className="panel-header">
          <h2>Current Weather</h2>
        </div>
        <div className="panel-body">
          <div className="empty">Search for a location to see current weather and forecast.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel" aria-labelledby="weather-title">
      <div className="panel-header">
        <h2 id="weather-title">Current Weather</h2>
        <span className="status-pill">{formatDate(weather.current.date)}</span>
      </div>
      <div className="panel-body">
        <div className="weather-current">
          <Image
            alt={weather.current.description}
            src={getIconUrl(weather.current.icon)}
            width={96}
            height={96}
          />
          <div>
            <h2>{weather.location}</h2>
            <p className="temp">{weather.current.temp} C</p>
            <p>{weather.current.description}</p>
            <a
              className="map-link"
              href={`https://www.google.com/maps?q=${weather.coordinates.lat},${weather.coordinates.lon}`}
              rel="noreferrer"
              target="_blank"
            >
              Open map
            </a>
          </div>
        </div>

        <div className="meta-grid">
          <Metric label="High" value={`${weather.current.tempMax} C`} />
          <Metric label="Low" value={`${weather.current.tempMin} C`} />
          <Metric label="Humidity" value={`${weather.current.humidity}%`} />
          <Metric label="Wind" value={`${weather.current.windSpeed} m/s`} />
        </div>

        <div className="forecast-grid" aria-label="5 day forecast">
          {weather.forecast.map((day) => (
            <article className="forecast-card" key={day.date}>
              <span>{formatWeekday(day.date)}</span>
              <Image alt={day.description} src={getIconUrl(day.icon)} width={54} height={54} />
              <strong>{day.temp} C</strong>
              <p>{day.description}</p>
            </article>
          ))}
        </div>

        {weather.dateRange && (
          <div className="range-summary">
            <h3>Date range temperatures</h3>
            <p>
              {weather.dateRange.startDate} to {weather.dateRange.endDate}
            </p>
            <div className="range-list">
              {weather.rangeForecast.map((day) => (
                <div className="range-row" key={day.date}>
                  <span>{formatWeekday(day.date)}</span>
                  <strong>
                    {day.tempMin} C / {day.tempMax} C
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatWeekday(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}
