"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users as UsersIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  usersAPI,
  type User,
  type CreateUserRequest,
  type UpdateUserRequest,
} from "@/lib/api";

export default function UsersPage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: "SUPER_ADMIN" | "ADMIN" | "CUSTOMER";
    isActive: boolean;
  }>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "CUSTOMER",
    isActive: true,
  });

  const loadUsers = async () => {
    try {
      setLoadingData(true);
      const data = await usersAPI.getAll();
      console.log("Users API response:", data);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load users:", error);
      toast.error(error.response?.data?.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      router.push("/account/dashboard");
      return;
    }
    setLoading(false);
    loadUsers();
  }, [isAuthenticated, _hasHydrated, router, user]);

  if (!_hasHydrated || loading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return null;
  }

  const handleOpenDialog = (selectedUser?: User) => {
    if (selectedUser) {
      // Check if user is trying to edit themselves
      if (selectedUser.id === user?.id) {
        toast.error("You cannot change your own role");
        return;
      }

      // Check if ADMIN is trying to edit SUPER_ADMIN
      if (user?.role === "ADMIN" && selectedUser.role === "SUPER_ADMIN") {
        toast.error("You cannot edit a Super Admin user");
        return;
      }

      setEditingUser(selectedUser);
      setFormData({
        email: selectedUser.email,
        password: "", // Password cannot be edited
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        phone: selectedUser.phone || "",
        role: selectedUser.role,
        isActive: selectedUser.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "CUSTOMER",
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate role changes
    if (editingUser) {
      // Check if user is trying to edit their own role
      if (editingUser.id === user?.id && formData.role !== editingUser.role) {
        toast.error("You cannot change your own role");
        return;
      }

      // Check if ADMIN is trying to change SUPER_ADMIN role
      if (user?.role === "ADMIN" && editingUser.role === "SUPER_ADMIN") {
        toast.error("You cannot modify a Super Admin user");
        return;
      }

      // Check if ADMIN is trying to create or change someone to SUPER_ADMIN
      if (user?.role === "ADMIN" && formData.role === "SUPER_ADMIN") {
        toast.error("Only Super Admins can assign Super Admin role");
        return;
      }
    } else {
      // Creating new user - check if ADMIN is trying to create SUPER_ADMIN
      if (user?.role === "ADMIN" && formData.role === "SUPER_ADMIN") {
        toast.error("Only Super Admins can create Super Admin users");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (editingUser) {
        const updateData: UpdateUserRequest = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          role: formData.role,
          isActive: formData.isActive,
        };
        console.log("Updating user:", editingUser.id, updateData);
        await usersAPI.update(editingUser.id, updateData);
        toast.success("User updated successfully!");
      } else {
        const createData: CreateUserRequest = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          role: formData.role,
        };
        console.log("Creating user:", createData);
        await usersAPI.create(createData);
        toast.success("User created successfully!");
      }
      await loadUsers();
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error("Failed to save user:", error);
      toast.error(error.response?.data?.message || "Failed to save user. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (userId: string) => {
    // Check if user is trying to delete themselves
    if (userId === user?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    // Check if ADMIN is trying to delete SUPER_ADMIN
    const targetUser = users.find(u => u.id === userId);
    if (user?.role === "ADMIN" && targetUser?.role === "SUPER_ADMIN") {
      toast.error("You cannot delete a Super Admin user");
      return;
    }

    setDeletingUserId(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUserId) return;

    try {
      await usersAPI.delete(deletingUserId);
      toast.success("User deleted successfully!");
      await loadUsers();
      setIsDeleteDialogOpen(false);
      setDeletingUserId(null);
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast.error(error.response?.data?.message || "Failed to delete user. Please try again.");
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      SUPER_ADMIN: "bg-red-100 text-red-800 hover:bg-red-100",
      ADMIN: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      CUSTOMER: "bg-green-100 text-green-800 hover:bg-green-100",
    };
    return <Badge className={colors[role as keyof typeof colors]}>{role}</Badge>;
  };

  const filteredUsers = users.filter((u) =>
    u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Users</h1>
            <p className="text-gray-400 mt-1">Manage user accounts and permissions</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white border-0">
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </Button>
        </div>
      </div>

      <Card className="bg-dark-bg-card border-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-100">All Users</CardTitle>
              <CardDescription className="text-gray-400">Manage user accounts ({users.length} total)</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
              <Button onClick={() => handleOpenDialog()} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First User
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-white/5">
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Email</TableHead>
                  <TableHead className="text-gray-400">Phone</TableHead>
                  <TableHead className="text-gray-400">Role</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                          <span className="text-brand-400 font-semibold text-sm">
                            {u.firstName[0]}{u.lastName[0]}
                          </span>
                        </div>
                        <p className="font-medium text-gray-100">
                          {u.firstName} {u.lastName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400">{u.email}</TableCell>
                    <TableCell className="text-gray-400">{u.phone || "—"}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-dark-bg-card border-white/10 text-gray-100">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem onClick={() => handleOpenDialog(u)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            className="text-red-500 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                            onClick={() => handleDeleteClick(u.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-dark-bg-card border-white/10 text-gray-100 custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-gray-100">{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingUser
                ? "Update the user details below."
                : "Fill in the details to create a new user."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName" className="text-gray-300">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName" className="text-gray-300">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-300">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingUser}
                  className={`bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500 ${editingUser ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                {editingUser && (
                  <p className="text-xs text-gray-500">Email cannot be changed after creation</p>
                )}
              </div>
              {!editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-gray-300">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-gray-300">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                  className="bg-white/5 border-white/10 text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-gray-300">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as "SUPER_ADMIN" | "ADMIN" | "CUSTOMER" })}
                  disabled={editingUser?.id === user?.id}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-gray-100 focus:ring-0 focus:ring-offset-0 focus:border-brand-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-bg-card border-white/10 text-gray-100">
                    <SelectItem value="CUSTOMER" className="focus:bg-white/10 focus:text-white cursor-pointer">Customer</SelectItem>
                    <SelectItem value="ADMIN" className="focus:bg-white/10 focus:text-white cursor-pointer">Admin</SelectItem>
                    {user?.role === "SUPER_ADMIN" && (
                      <SelectItem value="SUPER_ADMIN" className="focus:bg-white/10 focus:text-white cursor-pointer">Super Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {editingUser?.id === user?.id && (
                  <p className="text-xs text-gray-500">You cannot change your own role</p>
                )}
                {user?.role === "ADMIN" && (
                  <p className="text-xs text-gray-500">Only Super Admins can assign Super Admin role</p>
                )}
              </div>
              {editingUser && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive" className="text-gray-300">Active Status</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    className="data-[state=checked]:bg-brand-600 data-[state=unchecked]:bg-gray-700"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
                className="bg-transparent border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-600 hover:bg-brand-700 text-white">
                {isSubmitting ? "Saving..." : editingUser ? "Update User" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-dark-bg-card border-white/10 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Delete User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-transparent border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
