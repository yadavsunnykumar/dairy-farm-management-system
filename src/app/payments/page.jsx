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
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";

function AddPaymentForm({ milkmen, onSuccess }) {
  const [paymentDate, setPaymentDate] = useState(() => {
    const t = todayBS();
    return bsToAD(t.year, t.month, t.day);
  });
  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: { milkmanId: "", amount: "", remarks: "" },
  });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => axios.post("/api/payments", data),
    onSuccess: (res, variables) => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["milkman", variables.milkmanId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Payment recorded — milkman's balance updated");
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
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.code}) — {m.branch?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="space-y-2">
        <Label>Amount (₹) *</Label>
        <Input type="number" step="0.01" min="0.01" {...register("amount", { required: true })} placeholder="1000.00" />
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

export default function PaymentsPage() {
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["payments", fromDate, toDate],
    queryFn: () => axios.get(`/api/payments?from=${fromDate}&to=${toDate}`).then((r) => r.data),
  });
  const { data: milkmenData } = useQuery({
    queryKey: ["milkmen"],
    queryFn: () => axios.get("/api/milkmen").then((r) => r.data),
  });

  const payments = paymentsData?.payments || [];
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pay Milkmen</h1>
            <p className="text-muted-foreground text-sm">Record money paid out to milkmen for their milk</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Pay Milkman</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pay Milkman</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground -mt-2">
                Record money you are paying out to a milkman. This will reduce their pending balance.
              </p>
              <AddPaymentForm milkmen={milkmenData?.milkmen} onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 items-end">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
          </div>
          {(fromDate || toDate) && (
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(""); setToDate(""); }}>Clear</Button>
          )}
        </div>

        {payments.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Paid Out</p>
              <p className="text-2xl font-bold text-purple-700">{formatCurrency(totalPaid)}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Milkman</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : payments.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payments recorded</TableCell></TableRow>
                ) : payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.paymentDate)}</TableCell>
                    <TableCell className="font-medium">{p.milkman?.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.branch?.name}</TableCell>
                    <TableCell className="font-medium text-purple-700">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.remarks || "—"}</TableCell>
                    <TableCell>
                      <Link href={`/milkmen/${p.milkman?.id}`}>
                        <Button variant="ghost" size="icon" title="View milkman details">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
