"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, MailOpen, Trash2, Eye, Filter } from "lucide-react";
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
import { contactAPI, type Contact } from "@/lib/api";

export default function ContactsPage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "read" | "unread">("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });

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
    loadContacts();
    loadStats();
  }, [isAuthenticated, _hasHydrated, router, user]);

  const loadContacts = async () => {
    try {
      setLoadingData(true);
      const data = await contactAPI.getAll();
      setContacts(data);
      setFilteredContacts(data);
    } catch (error: any) {
      console.error("Failed to load contacts:", error);
      toast.error(error.response?.data?.message || "Failed to load contacts");
      setContacts([]);
      setFilteredContacts([]);
    } finally {
      setLoadingData(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await contactAPI.getStats();
      setStats(data);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
    }
  };

  // Filter contacts
  useEffect(() => {
    let filtered = contacts;

    // Filter by status
    if (filterStatus === "read") {
      filtered = filtered.filter((c) => c.isRead);
    } else if (filterStatus === "unread") {
      filtered = filtered.filter((c) => !c.isRead);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredContacts(filtered);
  }, [contacts, filterStatus, searchQuery]);

  const handleView = async (contact: Contact) => {
    setSelectedContact(contact);
    setIsViewDialogOpen(true);

    // Mark as read if unread
    if (!contact.isRead) {
      try {
        await contactAPI.update(contact.id, { isRead: true });
        await loadContacts();
        await loadStats();
      } catch (error: any) {
        console.error("Failed to mark as read:", error);
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingContactId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingContactId) return;

    try {
      await contactAPI.delete(deletingContactId);
      toast.success("Contact deleted successfully!");
      await loadContacts();
      await loadStats();
      setIsDeleteDialogOpen(false);
      setDeletingContactId(null);
    } catch (error: any) {
      console.error("Failed to delete contact:", error);
      toast.error(error.response?.data?.message || "Failed to delete contact");
    }
  };

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

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
            <p className="text-gray-600 mt-1">View and manage customer inquiries</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Read</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.read}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>All Messages</CardTitle>
              <CardDescription>
                {filteredContacts.length} message{filteredContacts.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-600">Loading messages...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No messages found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Message Preview</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className={!contact.isRead ? "bg-blue-50/50" : ""}>
                    <TableCell>
                      {contact.isRead ? (
                        <MailOpen className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Mail className="w-4 h-4 text-blue-600" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell className="text-gray-600">{contact.email}</TableCell>
                    <TableCell className="max-w-xs truncate text-gray-600">
                      {contact.message}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(contact)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(contact.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Contact Message</DialogTitle>
            <DialogDescription>
              Received on {selectedContact && new Date(selectedContact.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-600">Name</p>
                <p className="text-base">{selectedContact.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Email</p>
                <p className="text-base">{selectedContact.email}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Message</p>
                <p className="text-base whitespace-pre-wrap">{selectedContact.message}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedContact) {
                  window.location.href = `mailto:${selectedContact.email}`;
                }
              }}
            >
              <Mail className="w-4 h-4 mr-2" />
              Reply via Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
