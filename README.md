# MZ Weather

A responsive weather query web app built with Next.js, Supabase, and WeatherAPI.com.

Completed scope: Full Stack submission covering Tech Assessment #1 and Tech Assessment #2.

## Features

- Search weather by city name, postal code, or GPS coordinates.
- Use the browser's current location through `navigator.geolocation`.
- Show current weather, weather icon, and 5 day forecast.
- Optional date range lookup for temperatures within the available 5 day forecast window.
- Date range validation for missing dates, invalid dates, reversed ranges, and unsupported ranges.
- Store each successful query in Supabase.
- Full CRUD for query history:
  - Create: `/api/weather` saves a successful weather lookup.
  - Read: `/api/history` and `/api/history/[id]`.
  - Update: edit a saved record location.
  - Delete: remove a saved record.
- Export saved history to CSV with `/api/history/export`.
- Map integration through a Google Maps link for each searched coordinate.
- Candidate and PM Accelerator information included in the app UI.
- Loading and error states on the frontend.
- Responsive layout for desktop and mobile.

## Project Structure

```text
app/
  api/
    history/
      [id]/route.ts       # Read, update, delete one history record
      export/route.ts     # CSV export for saved records
      route.ts            # List and create history records
    weather/route.ts      # Weather lookup + Supabase create
  globals.css             # App styles and responsive layout
  layout.tsx              # Root layout
  page.tsx                # Dynamic page wrapper
components/
  WeatherApp.tsx          # Main client application
  HistoryList.tsx         # History CRUD UI
  WeatherDisplay.tsx      # Current weather and forecast UI
  WeatherSearch.tsx       # City, postal code, GPS search form
lib/
  supabase-admin.ts       # Server-side Supabase client
  types.ts                # Shared TypeScript types
  weather-icons.ts        # Weather icon URL helper
  weather.ts              # WeatherAPI.com API wrapper
supabase/
  schema.sql              # Database table, index, trigger, RLS policy
```

## Setup

1. Install dependencies.

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in values.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEATHERAPI_API_KEY=your-weatherapi-key
```

3. Run the SQL in `supabase/schema.sql` in the Supabase SQL editor.

4. Start the app.

```bash
npm run dev
```

Open `http://localhost:3000`.

On Windows PowerShell, use `npm.cmd run dev` if script execution policy blocks `npm run dev`.

## Architecture

The browser never calls WeatherAPI.com or Supabase directly. The React UI calls local Next.js API Routes. Those routes validate input, call WeatherAPI.com from the server, and use the Supabase service role key to persist or mutate records.

`/api/weather` is the main workflow endpoint: it receives a search payload, fetches current weather and forecast, normalizes the response for the UI, then inserts the complete weather JSON into `weather_queries`.

`/api/history` and `/api/history/[id]` expose CRUD operations for saved query records. The frontend history panel uses those endpoints to refresh, view, rename, and delete records.

Date range searches are validated on the server and filtered against WeatherAPI.com's 5 day forecast data. Location existence is validated by WeatherAPI.com responses; unknown cities or invalid postal codes return a user-facing error.

`/api/history/export` reads saved records from Supabase and streams a CSV file for assessment export requirements.
