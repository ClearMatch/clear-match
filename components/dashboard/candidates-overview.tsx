import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CandidatesOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Candidate Pipeline Overview</CardTitle>
          <CardDescription>
            Distribution of candidates across different stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Placeholder for pipeline stages */}
            <div className="flex items-center">
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New Applications</span>
                  <span className="text-sm text-muted-foreground">24</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div className="h-2 w-1/3 rounded-full bg-primary" />
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">In Review</span>
                  <span className="text-sm text-muted-foreground">16</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div className="h-2 w-1/4 rounded-full bg-primary" />
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Interview Stage</span>
                  <span className="text-sm text-muted-foreground">12</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div className="h-2 w-1/5 rounded-full bg-primary" />
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Offer Extended</span>
                  <span className="text-sm text-muted-foreground">8</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div className="h-2 w-1/6 rounded-full bg-primary" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Top Skills</CardTitle>
          <CardDescription>
            Most common skills among candidates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">JavaScript</span>
                  <span className="text-sm text-muted-foreground">65%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div className="h-2 w-2/3 rounded-full bg-primary" />
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">React</span>
                  <span className="text-sm text-muted-foreground">55%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div className="h-2 w-[55%] rounded-full bg-primary" />
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">TypeScript</span>
                  <span className="text-sm text-muted-foreground">45%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div className="h-2 w-[45%] rounded-full bg-primary" />
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Node.js</span>
                  <span className="text-sm text-muted-foreground">35%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                  <div className="h-2 w-[35%] rounded-full bg-primary" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 