"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Milk, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function MilkRatePage() {
  const [newRate, setNewRate] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["milk-rate"],
    queryFn: () => axios.get("/api/milk-rate").then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (rate) => axios.put("/api/milk-rate", { rate }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["milk-rate"] });
      setNewRate("");
      toast.success("Milk rate updated");
    },
    onError: (e) => toast.error(e.response?.data?.error || "Error"),
  });

  const currentRate = data?.rate;

  return (
    <AppShell adminOnly>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Milk Rate</h1>
          <p className="text-muted-foreground text-sm">Set the global milk rate per liter</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Milk className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Rate</p>
                {isLoading ? (
                  <div className="animate-pulse h-8 w-24 bg-muted rounded mt-1" />
                ) : currentRate ? (
                  <>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(currentRate.rate)}<span className="text-sm font-normal text-muted-foreground ml-1">/ liter</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Set by {currentRate.setBy?.name} on {formatDate(currentRate.createdAt)}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No rate set yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Update Rate
            </CardTitle>
            <CardDescription>All new collection entries will use this rate automatically</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label>New Rate (₹ per liter)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 60.00"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => mutation.mutate(parseFloat(newRate))}
                  disabled={!newRate || mutation.isPending}
                >
                  {mutation.isPending ? "Saving..." : "Set Rate"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
