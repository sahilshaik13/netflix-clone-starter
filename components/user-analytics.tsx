"use client"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Pie, Bar, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, ArcElement, BarElement, PointElement, LineElement,
  Tooltip, Legend,
  Title,
} from "chart.js"
import * as React from "react"

ChartJS.register(
  CategoryScale, LinearScale, ArcElement, BarElement, PointElement, LineElement,
  Tooltip, Legend, Title
);

interface GenreData { name: string; count: number }
interface RatingData { rating: number; count: number }
interface UserAnalyticsProps {
  totalWatched?: number | null
  averageRating?: number | null
  genreData?: GenreData[] | null
  ratingData?: RatingData[] | null
  preferredGenreIds?: string[] | null
  genreLookup?: Record<string, string>
  watchedPerMonth?: { month: string, count: number }[]
}
const PALETTE = [
  "#E50914", "#AF19FF", "#FFBB28", "#00C49F",
  "#0088FE", "#FF8042", "#19FFD1", "#FFD119",
]

function safeNum(val: unknown, digits = 2, fallback: string | number = "N/A") {
  return typeof val === "number" && isFinite(val)
    ? val.toFixed(digits)
    : fallback
}

export function UserAnalytics({
  totalWatched = 0,
  averageRating = 0,
  genreData = [],
  ratingData = [],
  preferredGenreIds = [],
  genreLookup = {},
  watchedPerMonth = [],
}: UserAnalyticsProps) {
  const genreList = Array.isArray(genreData) ? genreData : []
  const ratingList = Array.isArray(ratingData) ? ratingData : []
  const prefGenres = Array.isArray(preferredGenreIds) ? preferredGenreIds : []

  // Genre Pie 
  const genrePieData = {
    labels: genreList.map(g => g.name),
    datasets: [{
      data: genreList.map(g => g.count),
      backgroundColor: PALETTE.slice(0, genreList.length),
      borderWidth: 2,
    }],
  }

  // Rating Bar
  const ratingBarData = {
    labels: ratingList.map(r => String(r.rating)),
    datasets: [{
      label: "Titles",
      data: ratingList.map(r => r.count),
      backgroundColor: PALETTE[5],
      borderRadius: 8,
    }],
  }

  // Watched Per Month (trends)
  const monthTrendData = {
    labels: (watchedPerMonth ?? []).map(e => e.month),
    datasets: [{
      label: "Watched",
      backgroundColor: "rgba(229, 9, 20, 0.5)",
      borderColor: "#E50914",
      fill: true,
      data: (watchedPerMonth ?? []).map(e => e.count),
      tension: 0.25,
      borderWidth: 3,
      pointRadius: 4
    }]
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top stats: stacked on mobile, side by side on sm+ */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 bg-muted/80 rounded-lg p-4 flex flex-col items-center justify-center shadow">
          <div className="text-base font-medium text-muted-foreground">Total Watched</div>
          <div className="text-2xl font-bold">{totalWatched ?? "N/A"}</div>
          <div className="text-xs text-gray-400">Movies & TV Shows</div>
        </div>
        <div className="flex-1 bg-muted/80 rounded-lg p-4 flex flex-col items-center justify-center shadow">
          <div className="text-base font-medium text-muted-foreground">Average Rating</div>
          <div className="text-2xl font-bold">{safeNum(averageRating, 1)} / 5</div>
          <div className="text-xs text-gray-400">Based on your reviews</div>
        </div>
      </div>

      {/* STACKED CHART PANELS */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Genre Pie (full width, chartjs) */}
        <div className="flex-1 flex flex-col items-center bg-background rounded-lg p-4 shadow">
          <div className="text-md font-semibold mb-2 self-start">Genre Distribution</div>
          {genreList.length > 0 ? (
            <div className="w-full flex justify-center">
              <Pie
                data={genrePieData}
                options={{
                  plugins: {
                    legend: { position: 'bottom', labels: { color: "#fff" } },
                    tooltip: { enabled: true },
                  },
                  responsive: true,
                  animation: { animateScale: true },
                  cutout: '60%', // doughnut
                }}
                width={180}
                height={180}
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8 w-full">No genre data available.</div>
          )}
        </div>
        {/* Rating Bar Chart */}
        <div className="flex-1 flex flex-col items-center bg-background rounded-lg p-4 shadow">
          <div className="text-md font-semibold mb-2 self-start">Rating Distribution</div>
          <div className="w-full">
            <Bar
              data={ratingBarData}
              options={{
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: true },
                },
                scales: {
                  x: { grid: { color: "#4441", borderColor: "#333" }, ticks: { color: "#fff" } },
                  y: { beginAtZero: true, grid: { color: "#4442" }, ticks: { color: "#fff" } }
                },
                responsive: true,
              }}
              height={180}
            />
          </div>
        </div>
      </div>

      {/* Trends over time */}
      <div className="w-full bg-background rounded-lg p-4 shadow flex flex-col">
        <div className="text-md font-semibold mb-2">Viewing Trends (Per Month)</div>
        {monthTrendData.labels.length ? (
          <div className="w-full">
            <Line
              data={monthTrendData}
              options={{
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: true },
                },
                scales: {
                  x: { grid: { display: false }, ticks: { color: "#fff" } },
                  y: { beginAtZero: true, grid: { color: "#4442" }, ticks: { color: "#fff" } }
                },
                responsive: true,
              }}
              height={180}
            />
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8 w-full">Not enough data for trends.</div>
        )}
      </div>

      <Separator className="my-2" />

      {/* Preferred Genres */}
      <div>
        <div className="text-md font-semibold mb-2">Your Preferred Genres</div>
        <div className="flex flex-wrap gap-2">
          {prefGenres.length > 0 ? prefGenres.map((genreId) => (
            <Badge key={genreId}>
              {genreLookup?.[genreId] ?? genreId.substring(0, 8)}
            </Badge>
          )) : (
            <span className="text-muted-foreground">No preferred genres set.</span>
          )}
        </div>
      </div>
    </div>
  )
}
