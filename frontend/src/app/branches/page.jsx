"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

function BranchForm({ branch, onSuccess }) {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { name: branch?.name || "", code: branch?.code || "", address: branch?.address || "", status: branch?.status || "ACTIVE" },
  });

  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data) =>
      branch
        ? axios.put(`/api/branches/${branch.id}`, data)
        : axios.post("/api/branches", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      toast.success(branch ? "Branch updated" : "Branch created");
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.error || "Error"),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Village Name</Label>
          <Input {...register("name", { required: true })} placeholder="Baswariya" />
        </div>
        <div className="space-y-2">
          <Label>Branch Code</Label>
          <Input {...register("code", { required: true })} placeholder="BAS" maxLength={5} className="uppercase" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address / Notes</Label>
        <Input {...register("address")} placeholder="District, Block, etc." />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select defaultValue={branch?.status || "ACTIVE"} onValueChange={(v) => setValue("status", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : branch ? "Update Branch" : "Create Branch"}
      </Button>
    </form>
  );
}

export default function BranchesPage() {
  const [open, setOpen] = useState(false);
  const [editBranch, setEditBranch] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => axios.get("/api/branches").then((r) => r.data),
  });

  return (
    <AppShell adminOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Villages / Branches</h1>
            <p className="text-muted-foreground text-sm">Each branch represents a village collection point</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditBranch(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditBranch(null)}>
                <Plus className="h-4 w-4 mr-2" /> Add Village
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editBranch ? "Edit Village" : "Add Village"}</DialogTitle>
              </DialogHeader>
              <BranchForm branch={editBranch} onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Village Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : data?.branches?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No branches yet</TableCell></TableRow>
                ) : (
                  data?.branches?.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell><Badge variant="outline">{b.code}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{b.address || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={b.status === "ACTIVE" ? "success" : "secondary"}>
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditBranch(b); setOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
