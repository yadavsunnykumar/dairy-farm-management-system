"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, formatLiters } from "@/lib/utils";
import { NepaliDatePicker } from "@/components/ui/NepaliDatePicker";
import { todayBS, bsToAD } from "@/lib/nepali-date";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, Building } from "lucide-react";

function DailyReport() {
  const [fromDate, setFromDate] = useState(() => {
    const t = todayBS();
    return bsToAD(t.year, t.month, t.day);
  });
  const [toDate, setToDate] = useState(() => {
    const t = todayBS();
    return bsToAD(t.year, t.month, t.day);
  });

  const from = fromDate ? fromDate.toISOString().split("T")[0] : "";
  const to = toDate ? toDate.toISOString().split("T")[0] : "";

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["report-daily", from, to],
    queryFn: () => axios.get(`/api/reports/daily?from=${from}&to=${to}`).then((r) => r.data),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs">From (BS)</Label>
          <NepaliDatePicker value={fromDate} onChange={setFromDate} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To (BS)</Label>
          <NepaliDatePicker value={toDate} onChange={setToDate} />
        </div>
        <Button onClick={refetch} variant="outline" size="sm">Refresh</Button>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Milk", value: formatLiters(data.summary.totalMilk) },
            { label: "Total Amount", value: formatCurrency(data.summary.totalAmount) },
            { label: "Total Paid", value: formatCurrency(data.summary.totalPaid) },
            { label: "Pending", value: formatCurrency(data.summary.pending) },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold mt-0.5">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Collections</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Milkman</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : data?.collections?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No data</TableCell></TableRow>
              ) : data?.collections?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{formatDate(c.date)}</TableCell>
                  <TableCell>{c.milkman?.name}</TableCell>
                  <TableCell>{formatLiters(c.quantity)}</TableCell>
                  <TableCell>{formatCurrency(c.rate)}</TableCell>
                  <TableCell>{formatCurrency(c.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function BranchReport() {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const from = fromDate ? fromDate.toISOString().split("T")[0] : "";
  const to = toDate ? toDate.toISOString().split("T")[0] : "";

  const { data, isLoading } = useQuery({
    queryKey: ["report-branch", from, to],
    queryFn: () => axios.get(`/api/reports/branch?from=${from}&to=${to}`).then((r) => r.data),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs">From (BS) — leave blank for all time</Label>
          <NepaliDatePicker value={fromDate} onChange={setFromDate} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To (BS)</Label>
          <NepaliDatePicker value={toDate} onChange={setToDate} />
        </div>
        {(fromDate || toDate) && (
          <Button variant="ghost" size="sm" onClick={() => { setFromDate(null); setToDate(null); }}>Clear</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead>Milkmen</TableHead>
                <TableHead>Total Milk</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : data?.report?.map((r) => (
                <TableRow key={r.branch.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {r.branch.name}
                    </div>
                  </TableCell>
                  <TableCell>{r.milkmenCount}</TableCell>
                  <TableCell>{formatLiters(r.totalMilk)}</TableCell>
                  <TableCell>{formatCurrency(r.totalAmount)}</TableCell>
                  <TableCell>{formatCurrency(r.totalPaid)}</TableCell>
                  <TableCell className="font-medium text-orange-600">{formatCurrency(r.pending)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  const { isAdmin } = useAuth();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" /> Reports</h1>
          <p className="text-muted-foreground text-sm">Financial summaries and analysis</p>
        </div>

        <Tabs defaultValue="daily">
          <TabsList>
            <TabsTrigger value="daily">Daily Report</TabsTrigger>
            {isAdmin && <TabsTrigger value="branch">Branch Report</TabsTrigger>}
          </TabsList>
          <TabsContent value="daily" className="mt-4"><DailyReport /></TabsContent>
          {isAdmin && <TabsContent value="branch" className="mt-4"><BranchReport /></TabsContent>}
        </Tabs>
      </div>
    </AppShell>
  );
}
