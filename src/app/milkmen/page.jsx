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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";

function MilkmanForm({ branches, onSuccess }) {
  const { isAdmin, user } = useAuth();
  const { register, handleSubmit, control } = useForm({
    defaultValues: { name: "", mobile: "", village: "", address: "", branchId: isAdmin ? "" : user?.branchId },
  });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => axios.post("/api/milkmen", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["milkmen"] });
      toast.success("Milkman added");
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.error || "Error"),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label>Name *</Label>
          <Input {...register("name", { required: true })} placeholder="Full name" />
        </div>
        <div className="space-y-2">
          <Label>Mobile</Label>
          <Input {...register("mobile")} placeholder="9876543210" type="tel" />
        </div>
        <div className="space-y-2">
          <Label>Village</Label>
          <Input {...register("village")} placeholder="Village name" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Address</Label>
          <Input {...register("address")} placeholder="Full address" />
        </div>
        {isAdmin && (
          <div className="space-y-2 col-span-2">
            <Label>Branch *</Label>
            <Controller
              name="branchId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Add Milkman"}
      </Button>
    </form>
  );
}

export default function MilkmenPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { isAdmin } = useAuth();

  const { data: milkmenData, isLoading } = useQuery({
    queryKey: ["milkmen", search],
    queryFn: () => axios.get(`/api/milkmen?search=${search}`).then((r) => r.data),
  });
  const { data: branchData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => axios.get("/api/branches").then((r) => r.data),
    enabled: isAdmin,
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Milkmen</h1>
            <p className="text-muted-foreground text-sm">Manage milk suppliers</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Milkman</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Milkman</DialogTitle></DialogHeader>
              <MilkmanForm branches={branchData?.branches} onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, code, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Village</TableHead>
                  {isAdmin && <TableHead>Branch</TableHead>}
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : milkmenData?.milkmen?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No milkmen found</TableCell></TableRow>
                ) : milkmenData?.milkmen?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell><Badge variant="outline" className="font-mono">{m.code}</Badge></TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-muted-foreground">{m.mobile || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.village || "—"}</TableCell>
                    {isAdmin && <TableCell>{m.branch?.name}</TableCell>}
                    <TableCell>
                      <Link href={`/milkmen/${m.id}`}>
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
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
