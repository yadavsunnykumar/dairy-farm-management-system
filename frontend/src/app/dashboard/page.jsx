"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatLiters } from "@/lib/utils";
import { Droplets, IndianRupee, TrendingUp, Clock, Users, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [filter, setFilter] = useState("today");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", filter],
    queryFn: () => axios.get(`/api/dashboard?filter=${filter}`).then((r) => r.data),
  });

  const stats = data?.stats;
  const milkmanLedger = data?.milkmanLedger || [];

  const pendingCount  = milkmanLedger.filter((m) => !m.settled).length;
  const settledCount  = milkmanLedger.filter((m) => m.settled).length;

  return (
    <AppShell>
      <div className="space-y-6">

        {/* Header + filter */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Overview of your dairy operations</p>
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              {FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Summary stat cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-6"><div className="animate-pulse h-16 bg-muted rounded" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Milk Collected" value={formatLiters(stats?.totalMilk || 0)} icon={Droplets} color="bg-blue-500" />
            <StatCard title="Total Amount (Period)" value={formatCurrency(stats?.totalAmount || 0)} icon={IndianRupee} color="bg-green-500" />
            <StatCard title="Total Paid (Period)" value={formatCurrency(stats?.totalPaid || 0)} icon={TrendingUp} color="bg-purple-500" />
            <StatCard title="Pending Balance" value={formatCurrency(stats?.pending || 0)} icon={Clock} color="bg-orange-500" />
          </div>
        )}

        {/* Quick summary bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Total Milkmen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{stats?.milkmenCount || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/40 dark:bg-orange-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-orange-700 dark:text-orange-400">Pending Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">{pendingCount}</p>
              <p className="text-xs text-orange-500 dark:text-orange-400/70 mt-1">milkmen with outstanding balance</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800 bg-green-50/40 dark:bg-green-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-green-700 dark:text-green-400">Fully Settled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">{settledCount}</p>
              <p className="text-xs text-green-500 dark:text-green-400/70 mt-1">milkmen with zero balance</p>
            </CardContent>
          </Card>
        </div>

        {/* Milkman-wise ledger table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Milkman-wise Payment Status</CardTitle>
              <span className="text-xs text-muted-foreground">All-time cumulative balance</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-semibold">Milkman</TableHead>
                    <TableHead className="font-semibold">Branch</TableHead>
                    <TableHead className="font-semibold text-right">Total Litres</TableHead>
                    <TableHead className="font-semibold text-right text-red-700 dark:text-red-400">Total Earned (Dr)</TableHead>
                    <TableHead className="font-semibold text-right text-green-700 dark:text-green-400">Total Paid (Cr)</TableHead>
                    <TableHead className="font-semibold text-right">Balance</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : milkmanLedger.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        No milkmen found
                      </TableCell>
                    </TableRow>
                  ) : (
                    milkmanLedger.map((m) => (
                      <TableRow
                        key={m.id}
                        className={cn(
                          "transition-colors",
                          !m.settled && m.balance > 0 ? "bg-orange-50/30 dark:bg-orange-950/20" : ""
                        )}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{m.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{m.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{m.branch}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatLiters(m.totalLitres)}</TableCell>
                        <TableCell className="text-right font-medium text-red-700 dark:text-red-400">
                          {formatCurrency(m.totalEarned)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-700 dark:text-green-400">
                          {formatCurrency(m.totalPaidOut)}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-bold",
                          m.balance > 0 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"
                        )}>
                          {formatCurrency(m.balance > 0 ? m.balance : 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          {m.settled ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                              Settled
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                              Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/milkmen/${m.id}`} className="text-muted-foreground hover:text-primary transition-colors">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>

                {/* Totals footer */}
                {milkmanLedger.length > 0 && (
                  <tfoot>
                    <TableRow className="bg-muted/60 font-semibold border-t-2">
                      <TableCell colSpan={2} className="font-bold py-3">Total</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatLiters(milkmanLedger.reduce((s, m) => s + m.totalLitres, 0))}
                      </TableCell>
                      <TableCell className="text-right text-red-700">
                        {formatCurrency(milkmanLedger.reduce((s, m) => s + m.totalEarned, 0))}
                      </TableCell>
                      <TableCell className="text-right text-green-700">
                        {formatCurrency(milkmanLedger.reduce((s, m) => s + m.totalPaidOut, 0))}
                      </TableCell>
                      <TableCell className="text-right text-orange-600 font-bold">
                        {formatCurrency(milkmanLedger.reduce((s, m) => s + Math.max(m.balance, 0), 0))}
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </tfoot>
                )}
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}
