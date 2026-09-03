'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem
} from '@/components/ui/pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCcw
} from 'lucide-react';
import { getAuthToken } from '@/service/service';
import { getUsers, getMemberships, deleteUser, getUserById, getUserLicenses, getResources, deleteResource, getUserBookmarks, getUserMapPins } from '@/lib/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import UserDetails from './UserDetails';
import Link from 'next/link';
import { getAppImageUrl } from '@/lib/utils';
import { ConfirmDialog } from '@/components/confirm-dialog';

interface User {
  id: string;
  firebase_uid: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  profile: {
    current_tier: string;
    profile_picture: string | null;
    membership: {
      name: string;
      price_usd: string;
    }
  }
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Record<string, any> | null>(null);
  const [selectedUserLicenses, setSelectedUserLicenses] = useState<Record<string, any>[]>([]);
  const [selectedUserResources, setSelectedUserResources] = useState<Record<string, any>[]>([]);
  const [selectedUserMapPins, setSelectedUserMapPins] = useState<Record<string, any>[]>([]);
  const [mapPinsLimit, setMapPinsLimit] = useState(10);
  const [mapPinsTotal, setMapPinsTotal] = useState(0);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchMemberships = React.useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      await getMemberships(token, 1, 999);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');

      const response = await getUsers(token, page, limit, debouncedSearchTerm);
      if (response && response.data) {
        setUsers(response.data.users);
        const { totalPages, totaldata } = response.data.pagination;
        setTotalItems(totaldata);
        setTotalPages(totalPages);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearchTerm]);

  useEffect(() => {
    fetchUsers();
    fetchMemberships();
  }, [fetchUsers, fetchMemberships]);

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');

      await deleteUser(token, userToDelete);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
      setConfirmDialog(false);
      setUserToDelete(null);
    }
  };

  const handleViewUser = async (userId: string) => {
    setIsViewOpen(true);
    setIsDetailsLoading(true);
    setSelectedUserLicenses([]);
    setSelectedUserResources([]);
    setSelectedUserMapPins([]);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');

      const userInList = users.find(u => u.id === userId);
      const userEmail = userInList?.email || '';

      const [userResponse, licensesResponse, bookmarksResponse, mapPinsResponse] = await Promise.allSettled([
        getUserById(token, userId),
        getUserLicenses(token, userId),
        getUserBookmarks(token, userEmail),
        getUserMapPins(token, userEmail, 10)
      ]);

      let finalUserResponse: Record<string, any> | null = null;
      let finalLicenses: Record<string, any>[] = [];

      // Handle user profile response
      if (userResponse.status === 'fulfilled') {
        finalUserResponse = userResponse.value;
        setSelectedUser(finalUserResponse);

        // Priority 1: Licenses from the user profile detail response
        if (finalUserResponse?.user && typeof finalUserResponse.user === 'object') {
          const userObj = finalUserResponse.user as Record<string, any>;
          if (userObj.licenses && Array.isArray(userObj.licenses)) {
            finalLicenses = userObj.licenses;
          }
        }
      } else {
        throw new Error('Failed to fetch user details');
      }

      // Priority 2: Licenses from the separate licenses endpoint (if Profile didn't have them)
      if (finalLicenses.length === 0 && licensesResponse.status === 'fulfilled') {
        const lr = licensesResponse.value;
        let extLicenses = [];
        if (Array.isArray(lr)) {
          extLicenses = lr;
        } else if (lr?.data && Array.isArray(lr.data)) {
          extLicenses = lr.data;
        } else if (lr?.licenses && Array.isArray(lr.licenses)) {
          extLicenses = lr.licenses;
        }

        // Filter by userId
        finalLicenses = extLicenses.filter((l: Record<string, any>) =>
          l.user_id && String(l.user_id).toLowerCase() === String(userId).toLowerCase()
        );
      }

      setSelectedUserLicenses(finalLicenses);

      // Handle bookmarks response
      if (bookmarksResponse.status === 'fulfilled') {
        const bookmarksData = bookmarksResponse.value;
        const bookmarks = bookmarksData?.bookmarks || [];
        setSelectedUserResources(bookmarks);
      }

      // Handle map pins response
      if (mapPinsResponse.status === 'fulfilled') {
        const pinsData = mapPinsResponse.value;
        const pins = pinsData?.data || [];
        setSelectedUserMapPins(pins);
        setMapPinsTotal(pinsData?.total || 0);
        setMapPinsLimit(10);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to fetch user details');
      setIsViewOpen(false);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleLoadMoreMapPins = async () => {
    if (!selectedUser) return;
    const userObj = selectedUser.user as Record<string, any>;
    const userEmail = String(userObj.email || '');
    const token = await getAuthToken();
    if (!token) return;

    const newLimit = mapPinsLimit + 10;
    const response = await getUserMapPins(token, userEmail, newLimit);

    if (response?.data) {
      setSelectedUserMapPins(response.data);
      setMapPinsLimit(newLimit);
    }
  };


  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Users</h1>
        <div className="flex items-center gap-3">

          <Link href="/crm/users/create">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <Card className="border shadow-sm">
        <CardContent className="p-5 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  users.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-xs text-muted-foreground" title={user.id}>
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={getAppImageUrl(user.profile?.profile_picture)} alt={user.display_name} />
                            <AvatarFallback className="bg-muted">
                              <img
                                src="/assets/user-profile/profile.png"
                                alt="Default"
                                className="h-full w-full object-cover"
                              />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{user.display_name || `${user.first_name} ${user.last_name}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.status === 'active' ? 'success' : 'destructive'}
                          appearance="light"
                          className="rounded-md px-2 py-0.5"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                            {user.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {user.profile?.membership?.name || user.profile?.current_tier || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleViewUser(user.id)} className='cursor-pointer'>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <Link href={`/crm/users/edit/${user.id}`}>
                              <DropdownMenuItem className='cursor-pointer'>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
                              className='cursor-pointer'
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <Select
                value={limit.toString()}
                onValueChange={(val) => setLimit(Number(val))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={limit} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground mr-4">
                {(page - 1) * limit + 1} - {Math.min(page * limit, totalItems)} of {totalItems}
              </span>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                    <PaginationItem key={i}>
                      <Button
                        variant={page === i + 1 ? 'primary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    </PaginationItem>
                  ))}
                  {totalPages > 5 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserDetails
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        selectedUser={selectedUser}
        selectedUserLicenses={selectedUserLicenses}
        selectedUserResources={selectedUserResources}
        selectedUserMapPins={selectedUserMapPins}
        isDetailsLoading={isDetailsLoading}
        onLoadMoreMapPins={handleLoadMoreMapPins}
        mapPinsTotal={mapPinsTotal}
      />

      <ConfirmDialog
        isOpen={confirmDialog}
        onOpenChange={setConfirmDialog}
        title="Delete User?"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete User"}
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default UsersPage;
