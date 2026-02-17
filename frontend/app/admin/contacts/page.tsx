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
            <h1 className="text-2xl font-bold text-gray-100">Contact Messages</h1>
            <p className="text-gray-400 mt-1">View and manage customer inquiries</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-dark-bg-card border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-dark-bg-card border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{stats.unread}</div>
          </CardContent>
        </Card>
        <Card className="bg-dark-bg-card border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">Read</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.read}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-dark-bg-card border-white/5">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-gray-100">All Messages</CardTitle>
              <CardDescription className="text-gray-400">
                {filteredContacts.length} message{filteredContacts.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-500"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-full sm:w-[140px] bg-white/5 border-white/10 text-gray-100 focus:ring-0 focus:ring-offset-0 focus:border-brand-500">
                  <Filter className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-bg-card border-white/10 text-gray-100">
                  <SelectItem value="all" className="focus:bg-white/10 focus:text-white cursor-pointer">All Messages</SelectItem>
                  <SelectItem value="unread" className="focus:bg-white/10 focus:text-white cursor-pointer">Unread</SelectItem>
                  <SelectItem value="read" className="focus:bg-white/10 focus:text-white cursor-pointer">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-400">Loading messages...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No messages found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10 hover:bg-white/5">
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Email</TableHead>
                  <TableHead className="text-gray-400">Message Preview</TableHead>
                  <TableHead className="text-gray-400">Date</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className={`${!contact.isRead ? "bg-brand-500/5 hover:bg-brand-500/10" : "hover:bg-white/5"} border-b border-white/5`}>
                    <TableCell>
                      {contact.isRead ? (
                        <MailOpen className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Mail className="w-4 h-4 text-brand-400" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-gray-100">{contact.name}</TableCell>
                    <TableCell className="text-gray-400">{contact.email}</TableCell>
                    <TableCell className="max-w-xs truncate text-gray-400">
                      {contact.message}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(contact)}
                          className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(contact.id)}
                          className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
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
        <DialogContent className="sm:max-w-[600px] bg-dark-bg-card border-white/10 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Contact Message</DialogTitle>
            <DialogDescription className="text-gray-400">
              Received on {selectedContact && new Date(selectedContact.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-400">Name</p>
                <p className="text-base text-gray-100">{selectedContact.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-400">Email</p>
                <p className="text-base text-gray-100">{selectedContact.email}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-400">Message</p>
                <p className="text-base whitespace-pre-wrap text-gray-100">{selectedContact.message}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="bg-transparent border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedContact) {
                  window.location.href = `mailto:${selectedContact.email}`;
                }
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Mail className="w-4 h-4 mr-2" />
              Reply via Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-dark-bg-card border-white/10 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Delete Contact Message</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="bg-transparent border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
