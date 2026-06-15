import type { WeatherPayload, WeatherPoint, WeatherSearchInput } from "@/lib/types";
import { getIconUrl } from "@/lib/weather-icons";

const WEATHERAPI_BASE_URL = "https://api.weatherapi.com/v1";

type WeatherApiCondition = {
  text: string;
  icon: string;
};

type WeatherApiForecastDay = {
  date: string;
  date_epoch: number;
  day: {
    avgtemp_c: number;
    mintemp_c: number;
    maxtemp_c: number;
    avghumidity: number;
    maxwind_kph: number;
    condition: WeatherApiCondition;
  };
};

type WeatherApiForecastResponse = {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
  };
  current: {
    last_updated_epoch: number;
    temp_c: number;
    humidity: number;
    wind_kph: number;
    condition: WeatherApiCondition;
  };
  forecast: {
    forecastday: WeatherApiForecastDay[];
  };
};

export { getIconUrl };

export async function fetchWeather(input: WeatherSearchInput): Promise<WeatherPayload> {
  const apiKey = process.env.WEATHERAPI_API_KEY ?? process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error("WeatherAPI.com API key is not configured.");
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: buildWeatherQuery(input),
    days: "5",
    aqi: "no",
    alerts: "no"
  });

  const response = await fetch(`${WEATHERAPI_BASE_URL}/forecast.json?${params}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await weatherErrorMessage(response));
  }

  const weather = (await response.json()) as WeatherApiForecastResponse;
  const fiveDayForecast = weather.forecast.forecastday.slice(0, 5).map(mapForecastWeather);
  const dateRange = validateDateRange(input, fiveDayForecast);

  return {
    location: [weather.location.name, weather.location.region, weather.location.country]
      .filter(Boolean)
      .join(", "),
    coordinates: {
      lat: weather.location.lat,
      lon: weather.location.lon
    },
    dateRange,
    current: mapCurrentWeather(weather),
    forecast: fiveDayForecast,
    rangeForecast: filterForecastByDateRange(fiveDayForecast, dateRange),
    raw: {
      current: weather.current,
      forecast: weather.forecast
    }
  };
}

function buildWeatherQuery(input: WeatherSearchInput) {
  if (input.mode === "city") {
    if (!input.city?.trim()) {
      throw new Error("Please enter a city name.");
    }

    return [input.city.trim(), input.country?.trim()].filter(Boolean).join(",");
  }

  if (input.mode === "zip") {
    if (!input.zip?.trim()) {
      throw new Error("Please enter a postal code.");
    }

    return [input.zip.trim(), input.country?.trim()].filter(Boolean).join(",");
  }

  const lat = Number(input.lat);
  const lon = Number(input.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Please enter valid GPS coordinates.");
  }

  return `${lat},${lon}`;
}

function mapCurrentWeather(weather: WeatherApiForecastResponse): WeatherPoint {
  const today = weather.forecast.forecastday[0]?.day;

  return {
    date: new Date(weather.current.last_updated_epoch * 1000).toISOString(),
    temp: Math.round(weather.current.temp_c),
    tempMin: Math.round(today?.mintemp_c ?? weather.current.temp_c),
    tempMax: Math.round(today?.maxtemp_c ?? weather.current.temp_c),
    description: weather.current.condition.text || "Unknown",
    icon: weather.current.condition.icon,
    humidity: weather.current.humidity,
    windSpeed: kphToMps(weather.current.wind_kph)
  };
}

function mapForecastWeather(item: WeatherApiForecastDay): WeatherPoint {
  return {
    date: new Date(item.date_epoch * 1000).toISOString(),
    temp: Math.round(item.day.avgtemp_c),
    tempMin: Math.round(item.day.mintemp_c),
    tempMax: Math.round(item.day.maxtemp_c),
    description: item.day.condition.text || "Unknown",
    icon: item.day.condition.icon,
    humidity: Math.round(item.day.avghumidity),
    windSpeed: kphToMps(item.day.maxwind_kph)
  };
}

function validateDateRange(input: WeatherSearchInput, forecast: WeatherPoint[]) {
  if (!input.startDate && !input.endDate) {
    return undefined;
  }

  if (!input.startDate || !input.endDate) {
    throw new Error("Please enter both start and end dates.");
  }

  const startDate = parseDateOnly(input.startDate);
  const endDate = parseDateOnly(input.endDate);

  if (!startDate || !endDate) {
    throw new Error("Please enter valid dates.");
  }

  if (startDate.getTime() > endDate.getTime()) {
    throw new Error("Start date must be before or equal to end date.");
  }

  const availableDates = forecast.map((point) => parseDateOnly(point.date.slice(0, 10)));
  const firstAvailable = availableDates[0];
  const lastAvailable = availableDates[availableDates.length - 1];

  if (
    firstAvailable &&
    lastAvailable &&
    (startDate.getTime() < firstAvailable.getTime() || endDate.getTime() > lastAvailable.getTime())
  ) {
    throw new Error(
      `Date range must be within the available 5 day forecast: ${formatDateOnly(
        firstAvailable
      )} to ${formatDateOnly(lastAvailable)}.`
    );
  }

  return {
    startDate: formatDateOnly(startDate),
    endDate: formatDateOnly(endDate)
  };
}

function filterForecastByDateRange(forecast: WeatherPoint[], dateRange?: WeatherPayload["dateRange"]) {
  if (!dateRange) {
    return forecast;
  }

  const startTime = parseDateOnly(dateRange.startDate)?.getTime() ?? 0;
  const endTime = parseDateOnly(dateRange.endDate)?.getTime() ?? 0;

  return forecast.filter((point) => {
    const pointTime = parseDateOnly(point.date.slice(0, 10))?.getTime() ?? 0;
    return pointTime >= startTime && pointTime <= endTime;
  });
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (!match) {
    return null;
  }

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function weatherErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: { message?: string }; message?: string };
    return body.error?.message ?? body.message ?? "Weather API request failed.";
  } catch {
    return "Weather API request failed.";
  }
}

function kphToMps(value: number) {
  return Number((value / 3.6).toFixed(1));
}
