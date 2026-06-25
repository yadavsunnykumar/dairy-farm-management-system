"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NepaliDatePicker } from "@/components/ui/NepaliDatePicker";
import { todayBS, bsToAD } from "@/lib/nepali-date";
import { formatCurrency, formatDate, formatLiters, cn } from "@/lib/utils";
import { Plus, ExternalLink, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";

function AddCollectionForm({ milkmen, pricingConfig, onSuccess }) {
  const [shift, setShift] = useState("MORNING");
  const [collectionDate, setCollectionDate] = useState(() => {
    const t = todayBS();
    return bsToAD(t.year, t.month, t.day);
  });
  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: { milkmanId: "", quantity: "", fat: "", snf: "" },
  });

  const qty = parseFloat(watch("quantity")) || 0;
  const fat = parseFloat(watch("fat")) || 0;
  const snf = parseFloat(watch("snf")) || 0;
  const qc = useQueryClient();

  const isFatSnf = pricingConfig?.mode === "FAT_SNF";
  const previewRate = isFatSnf
    ? fat * (pricingConfig?.fatCoefficient ?? 0) + snf * (pricingConfig?.snfCoefficient ?? 0)
    : pricingConfig?.flatRate ?? 0;
  const previewAmount = qty * previewRate;

  const mutation = useMutation({
    mutationFn: (data) => axios.post("/api/collections", data),
    onSuccess: (res, variables) => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.invalidateQueries({ queryKey: ["milkman", variables.milkmanId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Collection recorded");
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.error || "Error"),
  });

  function onSubmit(data) {
    mutation.mutate({
      ...data,
      shift,
      date: collectionDate ? collectionDate.toISOString() : new Date().toISOString(),
      fat: isFatSnf ? data.fat : undefined,
      snf: isFatSnf ? data.snf : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Milkman */}
      <div className="space-y-2">
        <Label>Milkman *</Label>
        <Controller
          name="milkmanId"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="Select milkman" /></SelectTrigger>
              <SelectContent>
                {milkmen?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name} ({m.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Date and shift */}
      <div className="space-y-2">
        <Label>Date (BS) *</Label>
        <NepaliDatePicker value={collectionDate} onChange={setCollectionDate} />
      </div>

      <div className="space-y-2">
        <Label>Shift *</Label>
        <div className="flex gap-2">
          {["MORNING", "EVENING"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setShift(s)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 text-sm font-medium transition-colors",
                shift === s
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {s === "MORNING" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {s === "MORNING" ? "Morning" : "Evening"}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <Label>Quantity (Litres) *</Label>
        <Input type="number" step="0.1" min="0.1" {...register("quantity", { required: true })} placeholder="10.5" />
      </div>

      {/* Fat + SNF (only for FAT_SNF mode) */}
      {isFatSnf && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fat % *</Label>
            <Input type="number" step="0.1" min="0" max="20" {...register("fat", { required: isFatSnf })} placeholder="6.5" />
          </div>
          <div className="space-y-2">
            <Label>SNF % *</Label>
            <Input type="number" step="0.1" min="0" max="20" {...register("snf", { required: isFatSnf })} placeholder="9.5" />
          </div>
        </div>
      )}

      {/* Live rate preview */}
      {previewRate > 0 && (
        <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rate/L</span>
            <span className="font-medium">{formatCurrency(previewRate)}</span>
          </div>
          {qty > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total ({formatLiters(qty)})</span>
              <span className="font-bold text-primary">{formatCurrency(previewAmount)}</span>
            </div>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Recording..." : "Record Collection"}
      </Button>
    </form>
  );
}

export default function CollectionsPage() {
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: collectionsData, isLoading } = useQuery({
    queryKey: ["collections", fromDate, toDate],
    queryFn: () => axios.get(`/api/collections?from=${fromDate}&to=${toDate}`).then((r) => r.data),
  });
  const { data: milkmenData } = useQuery({
    queryKey: ["milkmen"],
    queryFn: () => axios.get("/api/milkmen").then((r) => r.data),
  });
  const { data: pricingData } = useQuery({
    queryKey: ["pricing-config"],
    queryFn: () => axios.get("/api/pricing-config").then((r) => r.data),
  });

  const collections = collectionsData?.collections || [];
  const totalMilk = collections.reduce((s, c) => s + c.quantity, 0);
  const totalAmount = collections.reduce((s, c) => s + c.totalAmount, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Milk Collections</h1>
            <p className="text-muted-foreground text-sm">
              Milk received from milkmen — each entry increases their earnings
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Collection</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Record Milk Collection</DialogTitle></DialogHeader>
              <AddCollectionForm
                milkmen={milkmenData?.milkmen}
                pricingConfig={pricingData?.config}
                onSuccess={() => setOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 items-end">
          <div className="space-y-1">
            <Label className="text-xs">From (AD)</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To (AD)</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
          </div>
          {(fromDate || toDate) && (
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(""); setToDate(""); }}>Clear</Button>
          )}
        </div>

        {collections.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Card><CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Milk</p>
              <p className="text-2xl font-bold">{formatLiters(totalMilk)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Amount Owed</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
            </CardContent></Card>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date (BS)</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Milkman</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Fat%</TableHead>
                    <TableHead>SNF%</TableHead>
                    <TableHead>Rate/L</TableHead>
                    <TableHead>Amount (−)</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : collections.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No collections found</TableCell></TableRow>
                  ) : collections.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{formatDate(c.date)}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                          c.shift === "MORNING" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"
                        )}>
                          {c.shift === "MORNING" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                          {c.shift === "MORNING" ? "M" : "E"}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{c.milkman?.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.branch?.name}</TableCell>
                      <TableCell>{formatLiters(c.quantity)}</TableCell>
                      <TableCell className="text-muted-foreground">{c.fat != null ? `${c.fat}%` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.snf != null ? `${c.snf}%` : "—"}</TableCell>
                      <TableCell>{formatCurrency(c.rate)}</TableCell>
                      <TableCell className="font-medium text-red-600">−{formatCurrency(c.totalAmount)}</TableCell>
                      <TableCell>
                        <Link href={`/milkmen/${c.milkman?.id}`}>
                          <Button variant="ghost" size="icon" title="View milkman">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
