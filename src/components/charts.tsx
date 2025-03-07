"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";
import { getSurveyResults } from "@/app/lib/api";
import { formatFullMonthYear, formatMonth } from "@/app/utils";
/* const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
]; */

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;
interface SurveyData {
  month: string;
  pregunta_id: number;
  question_avg_rating: number;
  overall_avg_rating: number;
}

interface MonthlyData {
  month: string;
  AnswersArray: SurveyData[];
}
export function ChartComponent() {
  const [chartData, setChartData] = useState([]);
  const [months, setMonths] = useState({ init: "", last: "" });
  function groupSurveyDataByMonth(data: SurveyData[]): MonthlyData[] {
    const monthlyGroups: { [month: string]: SurveyData[] } = {};

    for (const item of data) {
      const month = item.month;
      if (!monthlyGroups[month]) {
        monthlyGroups[month] = [];
      }
      monthlyGroups[month].push(item);
    }

    const result: MonthlyData[] = [];
    for (const month in monthlyGroups) {
      result.push({
        month: month,
        AnswersArray: monthlyGroups[month],
      });
    }

    return result;
  }
  useEffect(() => {
    getSurveyResults().then((data) => {
      if (data.success) {
        const apiResult = groupSurveyDataByMonth(data.data.reportJson?.data);
        console.log(apiResult);
        // console.log(Object.values());
        // setChartData(Object.values(apiResult));
        /* const timestamps = data.data.reportJson?.data.map(
          (item: Record<string, any>) => {
            return new Date(item.month).getTime();
          }
        );

        // Get min and max timestamps.
        const minTimestamp = Math.min(...timestamps);
        const maxTimestamp = Math.max(...timestamps);

        // Convert back to date strings (ISO format).
        const minMonth2 = new Date(minTimestamp).toISOString();
        const maxMonth2 = new Date(maxTimestamp).toISOString();
        setMonths({ init: minMonth2, last: maxMonth2 }); */
      }
    });
  }, []);
  return (
    <Card>
      {chartData.length > 0 ? (
        <>
          {" "}
          <CardHeader>
            <CardTitle>Bar Chart - Horizontal</CardTitle>
            <CardDescription>
              {formatFullMonthYear(months.init)} -{" "}
              {formatFullMonthYear(months.last)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{
                  left: -20,
                }}
              >
                <XAxis type="number" dataKey="ratingPromedio" hide />
                <YAxis
                  dataKey="pregunta"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  //   tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="ratingPromedio"
                  fill="var(--color-desktop)"
                  radius={5}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
          {/*  <CardFooter className="flex-col items-start gap-2 text-sm">
         <div className="flex gap-2 font-medium leading-none">
           Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
         </div>
         <div className="leading-none text-muted-foreground">
           Showing total visitors for the last 6 months
         </div>
       </CardFooter> */}
        </>
      ) : (
        <CardHeader>
          <CardTitle>Bar Chart - Horizontal</CardTitle>
          <CardDescription>No data yet</CardDescription>
        </CardHeader>
      )}
    </Card>
  );
}
