"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Settings, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

function PricingForm({ config, onSaved }) {
  const [mode, setMode] = useState(config?.mode ?? "FLAT_RATE");
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      flatRate: config?.flatRate ?? 60,
      fatCoefficient: config?.fatCoefficient ?? 6.5,
      snfCoefficient: config?.snfCoefficient ?? 4.0,
    },
  });

  const flatRate = watch("flatRate");
  const fatCoeff = watch("fatCoefficient");
  const snfCoeff = watch("snfCoefficient");

  const mutation = useMutation({
    mutationFn: (data) => axios.put("/api/pricing-config", data),
    onSuccess: () => {
      toast.success("Pricing configuration saved");
      onSaved();
    },
    onError: (e) => toast.error(e.response?.data?.error || "Error saving config"),
  });

  function onSubmit(data) {
    mutation.mutate({ mode, ...data });
  }

  // Live preview rate with example Fat=6.5, SNF=9.5
  const exampleFat = 6.5;
  const exampleSnf = 9.5;
  const previewRate =
    mode === "FAT_SNF"
      ? exampleFat * parseFloat(fatCoeff || 0) + exampleSnf * parseFloat(snfCoeff || 0)
      : parseFloat(flatRate || 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Mode selector */}
      <div className="space-y-2">
        <Label>Pricing Mode</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("FLAT_RATE")}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors text-left",
              mode === "FLAT_RATE"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            <div className="font-semibold">Flat Rate</div>
            <div className="text-xs mt-0.5 opacity-70">Fixed price per litre for all milk</div>
          </button>
          <button
            type="button"
            onClick={() => setMode("FAT_SNF")}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors text-left",
              mode === "FAT_SNF"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            <div className="font-semibold">FAT + SNF Formula</div>
            <div className="text-xs mt-0.5 opacity-70">Rate = Fat% × coeff + SNF% × coeff</div>
          </button>
        </div>
      </div>

      {/* Flat Rate inputs */}
      {mode === "FLAT_RATE" && (
        <div className="space-y-2">
          <Label>Rate per Litre (₹)</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            {...register("flatRate", { required: mode === "FLAT_RATE" })}
            placeholder="60.00"
          />
        </div>
      )}

      {/* FAT+SNF inputs */}
      {mode === "FAT_SNF" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fat Coefficient</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                {...register("fatCoefficient", { required: mode === "FAT_SNF" })}
                placeholder="6.5"
              />
              <p className="text-xs text-muted-foreground">Multiplied by Fat%</p>
            </div>
            <div className="space-y-2">
              <Label>SNF Coefficient</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                {...register("snfCoefficient", { required: mode === "FAT_SNF" })}
                placeholder="4.0"
              />
              <p className="text-xs text-muted-foreground">Multiplied by SNF%</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1 text-sm">
            <p className="font-medium text-blue-800">Formula preview</p>
            <p className="text-blue-700 font-mono">
              Rate = Fat% × {parseFloat(fatCoeff || 0).toFixed(1)} + SNF% × {parseFloat(snfCoeff || 0).toFixed(1)}
            </p>
            <p className="text-blue-600 text-xs mt-1">
              Example (Fat {exampleFat}, SNF {exampleSnf}): ₹{previewRate.toFixed(2)}/L
            </p>
          </div>
        </div>
      )}

      {/* Preview for flat rate */}
      {mode === "FLAT_RATE" && flatRate && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <p className="font-medium text-green-800">All milkmen will earn</p>
          <p className="text-green-700 font-semibold text-lg">
            {formatCurrency(parseFloat(flatRate || 0))}/L
          </p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Save Pricing Configuration"}
      </Button>
    </form>
  );
}

export default function PricingConfigPage() {
  const [editing, setEditing] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pricing-config"],
    queryFn: () => axios.get("/api/pricing-config").then((r) => r.data),
  });

  const config = data?.config;

  return (
    <AppShell adminOnly>
      <div className="max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pricing Configuration</h1>
            <p className="text-muted-foreground text-sm">
              Set how milk rates are calculated for all branches
            </p>
          </div>
          {!editing && config && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Settings className="h-4 w-4 mr-2" /> Edit
            </Button>
          )}
        </div>

        {/* Current config display */}
        {!editing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Current Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : config ? (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        config.mode === "FAT_SNF"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      )}
                    >
                      {config.mode === "FAT_SNF" ? "FAT + SNF Formula" : "Flat Rate"}
                    </span>
                  </div>

                  {config.mode === "FLAT_RATE" ? (
                    <div>
                      <p className="text-sm text-muted-foreground">Rate per Litre</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(config.flatRate)}/L
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Fat Coefficient</p>
                          <p className="text-xl font-bold">{config.fatCoefficient}</p>
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">SNF Coefficient</p>
                          <p className="text-xl font-bold">{config.snfCoefficient}</p>
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm font-mono text-blue-800">
                        Rate = Fat% × {config.fatCoefficient} + SNF% × {config.snfCoefficient}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Example — Fat 6.5, SNF 9.5 →{" "}
                        ₹{(6.5 * config.fatCoefficient + 9.5 * config.snfCoefficient).toFixed(2)}/L
                      </p>
                    </div>
                  )}

                  {config.setBy && (
                    <p className="text-xs text-muted-foreground">
                      Set by {config.setBy.name} · {new Date(config.createdAt).toLocaleDateString()}
                    </p>
                  )}

                  <Button className="w-full" onClick={() => setEditing(true)}>
                    <Settings className="h-4 w-4 mr-2" /> Change Pricing
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">No pricing configured yet</p>
                  <Button onClick={() => setEditing(true)}>Set Pricing</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit form */}
        {editing && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Pricing Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <PricingForm
                config={config}
                onSaved={() => {
                  setEditing(false);
                  qc.invalidateQueries({ queryKey: ["pricing-config"] });
                }}
              />
              <Button
                variant="ghost"
                className="w-full mt-2"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
