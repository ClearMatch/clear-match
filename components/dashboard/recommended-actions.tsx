import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function RecommendedActions() {
  const actions = [
    {
      title: "Review New Applications",
      description: "You have 5 new applications waiting for review",
      action: "Review Now",
    },
    {
      title: "Schedule Interviews",
      description: "3 candidates are ready for interview scheduling",
      action: "Schedule",
    },
    {
      title: "Update Job Postings",
      description: "2 job postings need attention",
      action: "Update",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {actions.map((item, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-lg">{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">{item.action}</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
