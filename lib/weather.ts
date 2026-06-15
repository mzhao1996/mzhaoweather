import type { WeatherPayload, WeatherPoint, WeatherSearchInput } from "@/lib/types";
import { getIconUrl } from "@/lib/weather-icons";

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

type OpenWeatherForecastItem = {
  dt: number;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  dt_txt: string;
};

type OpenWeatherResponse = {
  name: string;
  coord: {
    lat: number;
    lon: number;
  };
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  dt: number;
  sys?: {
    country?: string;
  };
};

type OpenWeatherForecastResponse = {
  list: OpenWeatherForecastItem[];
};

export { getIconUrl };

export async function fetchWeather(input: WeatherSearchInput): Promise<WeatherPayload> {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error("OpenWeatherMap API key is not configured.");
  }

  const query = buildWeatherQuery(input);
  const currentUrl = `${OPENWEATHER_BASE_URL}/weather?${query}&appid=${apiKey}&units=metric`;
  const forecastUrl = `${OPENWEATHER_BASE_URL}/forecast?${query}&appid=${apiKey}&units=metric`;

  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(currentUrl, { cache: "no-store" }),
    fetch(forecastUrl, { cache: "no-store" })
  ]);

  if (!currentResponse.ok) {
    throw new Error(await weatherErrorMessage(currentResponse));
  }

  if (!forecastResponse.ok) {
    throw new Error(await weatherErrorMessage(forecastResponse));
  }

  const current = (await currentResponse.json()) as OpenWeatherResponse;
  const forecast = (await forecastResponse.json()) as OpenWeatherForecastResponse;
  const fiveDayForecast = pickFiveDayForecast(forecast.list);
  const dateRange = validateDateRange(input, fiveDayForecast);

  return {
    location: [current.name, current.sys?.country].filter(Boolean).join(", "),
    coordinates: current.coord,
    dateRange,
    current: mapCurrentWeather(current),
    forecast: fiveDayForecast,
    rangeForecast: filterForecastByDateRange(fiveDayForecast, dateRange),
    raw: {
      current,
      forecast
    }
  };
}

function buildWeatherQuery(input: WeatherSearchInput) {
  const params = new URLSearchParams();

  if (input.mode === "city") {
    if (!input.city?.trim()) {
      throw new Error("Please enter a city name.");
    }

    const cityQuery = [input.city.trim(), input.country?.trim()].filter(Boolean).join(",");
    params.set("q", cityQuery);
    return params.toString();
  }

  if (input.mode === "zip") {
    if (!input.zip?.trim()) {
      throw new Error("Please enter a postal code.");
    }

    const zipQuery = [input.zip.trim(), input.country?.trim()].filter(Boolean).join(",");
    params.set("zip", zipQuery);
    return params.toString();
  }

  const lat = Number(input.lat);
  const lon = Number(input.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Please enter valid GPS coordinates.");
  }

  params.set("lat", String(lat));
  params.set("lon", String(lon));
  return params.toString();
}

function mapCurrentWeather(weather: OpenWeatherResponse): WeatherPoint {
  return {
    date: new Date(weather.dt * 1000).toISOString(),
    temp: Math.round(weather.main.temp),
    tempMin: Math.round(weather.main.temp_min),
    tempMax: Math.round(weather.main.temp_max),
    description: titleCase(weather.weather[0]?.description ?? "Unknown"),
    icon: weather.weather[0]?.icon ?? "01d",
    humidity: weather.main.humidity,
    windSpeed: weather.wind.speed
  };
}

function mapForecastWeather(item: OpenWeatherForecastItem): WeatherPoint {
  return {
    date: new Date(item.dt * 1000).toISOString(),
    temp: Math.round(item.main.temp),
    tempMin: Math.round(item.main.temp_min),
    tempMax: Math.round(item.main.temp_max),
    description: titleCase(item.weather[0]?.description ?? "Unknown"),
    icon: item.weather[0]?.icon ?? "01d",
    humidity: item.main.humidity,
    windSpeed: item.wind.speed
  };
}

function pickFiveDayForecast(items: OpenWeatherForecastItem[]) {
  const byDate = new Map<string, OpenWeatherForecastItem>();

  for (const item of items) {
    const dateKey = item.dt_txt.split(" ")[0];
    const hour = item.dt_txt.split(" ")[1];

    if (hour === "12:00:00" || !byDate.has(dateKey)) {
      byDate.set(dateKey, item);
    }
  }

  return Array.from(byDate.values()).slice(0, 5).map(mapForecastWeather);
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
    const body = (await response.json()) as { message?: string };
    return body.message ? `Weather API error: ${body.message}` : "Weather API request failed.";
  } catch {
    return "Weather API request failed.";
  }
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}
