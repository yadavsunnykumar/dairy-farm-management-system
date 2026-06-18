"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NepaliDatePicker } from "@/components/ui/NepaliDatePicker";
import { todayBS, bsToAD } from "@/lib/nepali-date";
import { formatCurrency, formatDate, formatLiters, cn } from "@/lib/utils";
import { Pencil, Phone, MapPin, Building, Droplets, IndianRupee, Clock, TrendingUp, Wallet, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";

function EditMilkmanForm({ milkman, onSuccess }) {
  const { register, handleSubmit } = useForm({
    defaultValues: { name: milkman.name, mobile: milkman.mobile || "", village: milkman.village || "", address: milkman.address || "" },
  });
  const qc = useQueryClient();
  const { id } = useParams();

  const mutation = useMutation({
    mutationFn: (data) => axios.put(`/api/milkmen/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["milkman", id] });
      toast.success("Milkman updated");
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.error || "Error"),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input {...register("name", { required: true })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Mobile</Label>
          <Input {...register("mobile")} type="tel" />
        </div>
        <div className="space-y-2">
          <Label>Village</Label>
          <Input {...register("village")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input {...register("address")} />
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Update"}
      </Button>
    </form>
  );
}

function PayMilkmanForm({ milkmanId, onSuccess }) {
  const [paymentDate, setPaymentDate] = useState(() => {
    const t = todayBS();
    return bsToAD(t.year, t.month, t.day);
  });
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { amount: "", remarks: "" },
  });
  const qc = useQueryClient();
  const { id } = useParams();

  const mutation = useMutation({
    mutationFn: (data) => axios.post("/api/payments", { ...data, milkmanId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["milkman", id] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Payment recorded successfully");
      reset();
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.error || "Error"),
  });

  function onSubmit(data) {
    mutation.mutate({
      ...data,
      paymentDate: paymentDate ? paymentDate.toISOString() : new Date().toISOString(),
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Amount (₹) *</Label>
        <Input type="number" step="0.01" min="0.01" placeholder="1000.00" {...register("amount", { required: true })} />
      </div>
      <div className="space-y-2">
        <Label>Date (BS) *</Label>
        <NepaliDatePicker value={paymentDate} onChange={setPaymentDate} />
      </div>
      <div className="space-y-2">
        <Label>Remarks</Label>
        <Input {...register("remarks")} placeholder="e.g. Weekly payment, Advance, etc." />
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Processing..." : "Pay Milkman"}
      </Button>
    </form>
  );
}

function RecordMilkForm({ milkmanId, pricingConfig, onSuccess }) {
  const [shift, setShift] = useState("MORNING");
  const [collectionDate, setCollectionDate] = useState(() => {
    const t = todayBS();
    return bsToAD(t.year, t.month, t.day);
  });
  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: { quantity: "", fat: "", snf: "" },
  });
  const qc = useQueryClient();
  const { id } = useParams();

  const qty = parseFloat(watch("quantity")) || 0;
  const fat = parseFloat(watch("fat")) || 0;
  const snf = parseFloat(watch("snf")) || 0;

  const isFatSnf = pricingConfig?.mode === "FAT_SNF";
  const previewRate = isFatSnf
    ? fat * (pricingConfig?.fatCoefficient ?? 0) + snf * (pricingConfig?.snfCoefficient ?? 0)
    : pricingConfig?.flatRate ?? 0;
  const previewAmount = qty * previewRate;

  const mutation = useMutation({
    mutationFn: (data) => axios.post("/api/collections", { ...data, milkmanId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["milkman", id] });
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Milk collection recorded");
      reset();
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
      {/* Date */}
      <div className="space-y-2">
        <Label>Date (BS) *</Label>
        <NepaliDatePicker value={collectionDate} onChange={setCollectionDate} />
      </div>

      {/* Shift */}
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
        <Input type="number" step="0.1" min="0.1" placeholder="10.5" {...register("quantity", { required: true })} />
      </div>

      {/* Fat + SNF for FAT_SNF mode */}
      {isFatSnf && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fat % *</Label>
            <Input type="number" step="0.1" min="0" max="20" placeholder="6.5" {...register("fat", { required: isFatSnf })} />
          </div>
          <div className="space-y-2">
            <Label>SNF % *</Label>
            <Input type="number" step="0.1" min="0" max="20" placeholder="9.5" {...register("snf", { required: isFatSnf })} />
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
              <span className="text-muted-foreground">Amount owed ({formatLiters(qty)})</span>
              <span className="font-bold text-red-600">−{formatCurrency(previewAmount)}</span>
            </div>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Recording..." : "Record Milk Collection"}
      </Button>
    </form>
  );
}

function LedgerCard({ label, value, icon: Icon, color, highlight }) {
  return (
    <Card className={highlight ? "border-orange-300 bg-orange-50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-lg font-bold ${highlight ? "text-orange-600" : ""}`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const ShiftBadge = ({ shift }) => (
  <span className={cn(
    "inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full",
    shift === "MORNING" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"
  )}>
    {shift === "MORNING" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
    {shift === "MORNING" ? "M" : "E"}
  </span>
);

export default function MilkmanDetailPage() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [milkOpen, setMilkOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["milkman", id],
    queryFn: () => axios.get(`/api/milkmen/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: pricingData } = useQuery({
    queryKey: ["pricing-config"],
    queryFn: () => axios.get("/api/pricing-config").then((r) => r.data),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppShell>
    );
  }

  const { milkman, ledger } = data || {};
  const canEdit = isAdmin || user?.branchId === milkman?.branchId;
  const pricingConfig = pricingData?.config;

  const allTransactions = [
    ...(milkman?.collections || []).map((c) => ({
      id: c.id,
      date: new Date(c.date),
      type: "collection",
      shift: c.shift,
      particular: "Milk",
      saleQty: c.quantity,
      rate: c.rate,
      fat: c.fat,
      snf: c.snf,
      drAmount: c.totalAmount,
      crAmount: 0,
    })),
    ...(milkman?.payments || []).map((p) => ({
      id: p.id,
      date: new Date(p.paymentDate),
      type: "payment",
      shift: null,
      particular: p.remarks ? `Payment (${p.remarks})` : "Payment",
      saleQty: 0,
      rate: null,
      fat: null,
      snf: null,
      drAmount: 0,
      crAmount: p.amount,
    })),
  ].sort((a, b) => a.date - b.date);

  // Running balance and cumulative litres
  let balance = 0;
  let totalLitres = 0;
  const ledgerRows = allTransactions.map((t) => {
    balance = balance - t.drAmount + t.crAmount;
    totalLitres += t.saleQty;
    return { ...t, balance, totalLitres };
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{milkman?.name}</h1>
              <Badge variant="outline" className="font-mono">{milkman?.code}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {milkman?.mobile && (
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {milkman.mobile}</span>
              )}
              {milkman?.village && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {milkman.village}</span>
              )}
              <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {milkman?.branch?.name}</span>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <Dialog open={milkOpen} onOpenChange={setMilkOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Droplets className="h-4 w-4 mr-2 text-blue-500" /> Record Milk
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Record Milk from {milkman?.name}</DialogTitle>
                  </DialogHeader>
                  <RecordMilkForm
                    milkmanId={milkman?.id}
                    pricingConfig={pricingConfig}
                    onSuccess={() => setMilkOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={payOpen} onOpenChange={setPayOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Wallet className="h-4 w-4 mr-2" /> Pay Milkman
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Pay {milkman?.name}</DialogTitle>
                  </DialogHeader>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                    <p className="text-sm text-orange-700 font-medium">
                      Pending Amount: {formatCurrency(ledger?.pending || 0)}
                    </p>
                    <p className="text-xs text-orange-600 mt-0.5">
                      Earned ₹{(ledger?.totalEarned || 0).toLocaleString("en-IN")} — Paid ₹{(ledger?.totalPaid || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <PayMilkmanForm milkmanId={milkman?.id} onSuccess={() => setPayOpen(false)} />
                </DialogContent>
              </Dialog>

              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Edit Milkman</DialogTitle></DialogHeader>
                  {milkman && <EditMilkmanForm milkman={milkman} onSuccess={() => setEditOpen(false)} />}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Ledger summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <LedgerCard label="Total Milk Given" value={formatLiters(ledger?.totalMilk || 0)} icon={Droplets} color="bg-blue-500" />
          <LedgerCard label="Total Earned" value={formatCurrency(ledger?.totalEarned || 0)} icon={IndianRupee} color="bg-green-500" />
          <LedgerCard label="Total Paid" value={formatCurrency(ledger?.totalPaid || 0)} icon={TrendingUp} color="bg-purple-500" />
          <LedgerCard
            label="Pending (To be Paid)"
            value={formatCurrency(ledger?.pending || 0)}
            icon={Clock}
            color="bg-orange-500"
            highlight={(ledger?.pending || 0) > 0}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ledger">
          <TabsList>
            <TabsTrigger value="ledger">Full Ledger</TabsTrigger>
            <TabsTrigger value="collections">Milk Collections</TabsTrigger>
            <TabsTrigger value="payments">Payments Made</TabsTrigger>
          </TabsList>

          {/* Combined ledger — matches Excel DR/CR format */}
          <TabsContent value="ledger">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Dr = farm owes milkman (milk given). Cr = payment made to milkman. Balance shows current outstanding.
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-semibold">Date (BS)</TableHead>
                        <TableHead className="font-semibold">Shift</TableHead>
                        <TableHead className="font-semibold">Particular</TableHead>
                        <TableHead className="font-semibold text-right">Sale Qty</TableHead>
                        <TableHead className="font-semibold text-right">Total Litres</TableHead>
                        <TableHead className="font-semibold text-right">Rate/L</TableHead>
                        <TableHead className="font-semibold text-right text-red-700">Dr Amount</TableHead>
                        <TableHead className="font-semibold text-right text-green-700">Cr Amount</TableHead>
                        <TableHead className="font-semibold text-right">Balance</TableHead>
                        <TableHead className="font-semibold text-center">Dr/Cr</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledgerRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                            No transactions yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        ledgerRows.map((row) => (
                          <TableRow key={row.id} className={row.type === "payment" ? "bg-green-50/40" : ""}>
                            <TableCell className="font-mono text-sm">{formatDate(row.date)}</TableCell>
                            <TableCell>
                              {row.shift ? <ShiftBadge shift={row.shift} /> : <span className="text-muted-foreground text-xs">—</span>}
                            </TableCell>
                            <TableCell className={`font-medium text-sm ${row.type === "payment" ? "text-green-700" : ""}`}>
                              {row.particular}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {row.saleQty > 0 ? formatLiters(row.saleQty) : "—"}
                            </TableCell>
                            <TableCell className="text-right text-sm font-mono">
                              {row.totalLitres > 0 ? formatLiters(row.totalLitres) : "—"}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {row.rate != null ? `${formatCurrency(row.rate)}` : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium text-red-700">
                              {row.drAmount > 0 ? formatCurrency(row.drAmount) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-700">
                              {row.crAmount > 0 ? formatCurrency(row.crAmount) : "—"}
                            </TableCell>
                            <TableCell className={`text-right font-bold ${row.balance < 0 ? "text-red-700" : row.balance === 0 ? "text-muted-foreground" : "text-green-700"}`}>
                              {formatCurrency(Math.abs(row.balance))}
                            </TableCell>
                            <TableCell className="text-center">
                              {row.balance < 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">Dr</span>
                              ) : row.balance === 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">Nil</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">Cr</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {ledgerRows.length > 0 && (
                        <TableRow className="bg-muted/60 font-semibold border-t-2">
                          <TableCell colSpan={3} className="font-bold">Total</TableCell>
                          <TableCell className="text-right">{formatLiters(ledger?.totalMilk || 0)}</TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell className="text-right text-red-700">{formatCurrency(ledger?.totalEarned || 0)}</TableCell>
                          <TableCell className="text-right text-green-700">{formatCurrency(ledger?.totalPaid || 0)}</TableCell>
                          <TableCell className={`text-right font-bold ${(ledger?.pending || 0) > 0 ? "text-red-700" : "text-green-700"}`}>
                            {formatCurrency(ledger?.pending || 0)}
                          </TableCell>
                          <TableCell className="text-center">
                            {(ledger?.pending || 0) > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">Dr</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">Settled</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collections tab */}
          <TabsContent value="collections">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Milk received from this milkman — each entry increases the amount the farm owes (−)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date (BS)</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Fat%</TableHead>
                        <TableHead>SNF%</TableHead>
                        <TableHead>Rate/L</TableHead>
                        <TableHead>Amount Owed (−)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {milkman?.collections?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No milk collections recorded
                          </TableCell>
                        </TableRow>
                      ) : (
                        milkman?.collections?.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-mono text-sm">{formatDate(c.date)}</TableCell>
                            <TableCell><ShiftBadge shift={c.shift} /></TableCell>
                            <TableCell>{formatLiters(c.quantity)}</TableCell>
                            <TableCell className="text-muted-foreground">{c.fat != null ? `${c.fat}%` : "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{c.snf != null ? `${c.snf}%` : "—"}</TableCell>
                            <TableCell>{formatCurrency(c.rate)}</TableCell>
                            <TableCell className="font-medium text-red-700">−{formatCurrency(c.totalAmount)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Money paid TO this milkman — each payment reduces the outstanding debt (+)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount Paid (+)</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {milkman?.payments?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No payments made to this milkman yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      milkman?.payments?.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{formatDate(p.paymentDate)}</TableCell>
                          <TableCell className="font-medium text-green-700">+{formatCurrency(p.amount)}</TableCell>
                          <TableCell className="text-muted-foreground">{p.remarks || "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
