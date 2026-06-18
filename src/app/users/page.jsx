"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";

function UserForm({ user: editUser, branches, onSuccess }) {
  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: {
      name: editUser?.name || "",
      email: editUser?.email || "",
      password: "",
      role: editUser?.role || "USER",
      branchId: editUser?.branchId || "",
    },
  });
  const role = watch("role");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) =>
      editUser
        ? axios.put(`/api/users/${editUser.id}`, data)
        : axios.post("/api/users", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(editUser ? "User updated" : "User created");
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.error || "Error"),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...register("name", { required: true })} placeholder="Full name" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input {...register("email", { required: true })} type="email" placeholder="email@example.com" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{editUser ? "New Password (leave blank to keep)" : "Password"}</Label>
        <Input {...register("password", { required: !editUser })} type="password" placeholder="••••••••" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Role</Label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="USER">Branch User</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {role === "USER" && (
          <div className="space-y-2">
            <Label>Branch</Label>
            <Controller
              name="branchId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : editUser ? "Update User" : "Create User"}
      </Button>
    </form>
  );
}

export default function UsersPage() {
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const qc = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => axios.get("/api/users").then((r) => r.data),
  });
  const { data: branchData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => axios.get("/api/branches").then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/api/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User deleted"); },
    onError: (e) => toast.error(e.response?.data?.error || "Error"),
  });

  return (
    <AppShell adminOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-muted-foreground text-sm">Manage system users</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditUser(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditUser(null)}>
                <Plus className="h-4 w-4 mr-2" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editUser ? "Edit User" : "Add User"}</DialogTitle>
              </DialogHeader>
              <UserForm user={editUser} branches={branchData?.branches} onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : usersData?.users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                    </TableCell>
                    <TableCell>{u.branch?.name || "—"}</TableCell>
                    <TableCell className="space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditUser(u); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
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
