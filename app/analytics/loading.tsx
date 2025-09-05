import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsLoading() {
  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
      <h1 className="mb-6 text-3xl font-bold text-primary">Your Viewing Analytics</h1>

      <Card className="bg-card text-card-foreground border-netflix-dark-light">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Viewing Habits Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-[150px] w-full rounded-lg" />
            <Skeleton className="h-[150px] w-full rounded-lg" />
          </div>
          <Skeleton className="h-[100px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  )
}
