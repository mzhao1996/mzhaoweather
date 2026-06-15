export type SearchMode = "city" | "zip" | "coords";

export type WeatherSearchInput = {
  mode: SearchMode;
  city?: string;
  zip?: string;
  country?: string;
  lat?: string;
  lon?: string;
  startDate?: string;
  endDate?: string;
};

export type WeatherPoint = {
  date: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
};

export type WeatherPayload = {
  location: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  current: WeatherPoint;
  forecast: WeatherPoint[];
  rangeForecast: WeatherPoint[];
  raw: {
    current: unknown;
    forecast: unknown;
  };
};

export type WeatherHistoryRecord = {
  id: string;
  location: string;
  weather_data: WeatherPayload;
  queried_at: string;
  updated_at: string;
};

export type ApiError = {
  error: string;
};
