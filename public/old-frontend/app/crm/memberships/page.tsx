'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuthToken } from '@/service/service';
import { getMemberships, getMembershipById, deleteMembership } from '@/lib/actions';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CreditCard, Plus, MoreVertical, Eye, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';

interface MembershipItem {
    id: string;
    name: string;
    description?: string;
    feature?: string;
    price_usd?: string;
    duration_days?: number;
    totalUsers?: string;
    created_at?: string;
    updated_at?: string;
    image?: string;
}

const MembershipDetails = ({ item, open, onOpenChange }: { item: MembershipItem | null, open: boolean, onOpenChange: (open: boolean) => void }) => {
    if (!item) return null;

    let features: any = {};
    try {
        if (item.feature) {
            features = typeof item.feature === 'string' ? JSON.parse(item.feature) : item.feature;
        }
    } catch (e: any) {
        console.error('Failed to parse features:', e);
        toast.error(e.message || 'Failed to parse features');
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <CreditCard className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Membership Details</span>
                    </div>
                    <DialogTitle className="text-2xl font-bold">{item.name}</DialogTitle>
                    <DialogDescription className="text-muted-foreground mt-1">
                        {item.description || 'No description provided.'}
                    </DialogDescription>
                </DialogHeader>

                {item.image && (
                    <div className="mt-4 rounded-lg  border border-border">
                        <img
                            src={`${process.env.NEXT_PUBLIC_BASE_URL}${item.image}`}
                            alt={item.name}
                            className="w-50 h-50"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-y border-border my-4">
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Price</h4>
                            <p className="text-lg font-semibold text-foreground">${item.price_usd || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Duration</h4>
                            <p className="text-sm font-medium text-foreground/80">{item.duration_days ? `${item.duration_days} Days` : 'N/A'}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Created At</h4>
                            <p className="text-sm font-medium text-foreground/80">
                                {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Users</h4>
                            <p className="text-sm font-medium text-foreground/80">{item.totalUsers || '0'}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <div className="h-4 w-1 bg-blue-600 rounded-full" />
                        Membership Features
                    </h4>

                    {Object.keys(features).length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(features).map(([key, value]: [string, any]) => (
                                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-/10 border border-border">
                                    <span className="text-xs font-medium text-muted-foreground capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <span className={`text-xs font-bold ${value === true ? 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded' :
                                        value === false ? 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 rounded' :
                                            'text-blue-600 dark:text-blue-400 font-mono'
                                        }`}>
                                        {typeof value === 'boolean' ? (value ? 'YES' : 'NO') : String(value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-muted rounded-lg border border-dashed border-border">
                            <p className="text-sm text-muted-foreground italic">No specific features defined for this membership.</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    <Link href={`/crm/memberships/edit/${item.id}`}>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Edit2 className="w-4 h-4" />
                            Edit Membership
                        </Button>
                    </Link>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const MembershipsPage = () => {
    const [items, setItems] = useState<MembershipItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedItem, setSelectedItem] = useState<MembershipItem | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(false);
    const [membershipToDelete, setMembershipDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchMemberships = React.useCallback(async () => {
        setLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await getMemberships(token, page, limit);

            let membershipItems: MembershipItem[] = [];

            if (response.data && Array.isArray(response.data)) {
                membershipItems = response.data;
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages);
                }
            } else if (Array.isArray(response)) {
                membershipItems = response;
            }

            setItems(membershipItems);

        } catch (error: any) {
            console.error(error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchMemberships();
    }, [fetchMemberships]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handleViewMembership = async (membershipId: string) => {
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await getMembershipById(token, membershipId);
            // The API returns { membership: { ... } }
            const membership = response.membership || response;
            setSelectedItem(membership);
            setIsDetailsOpen(true);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to fetch membership details');
        }
    };

    const handleDeleteMembership = (membershipId: string) => {
        setMembershipDelete(membershipId);
        setConfirmDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!membershipToDelete) return;

        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await deleteMembership(token, membershipToDelete);
            toast.success('Membership deleted successfully');
            fetchMemberships();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to delete membership');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <MembershipDetails
                item={selectedItem}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
            />
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Memberships
                </h1>
                <Link href="/crm/memberships/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                        <Plus className="w-4 h-4" />
                        Add Membership
                    </Button>
                </Link>
            </div>

            <Card className="border shadow-sm">
                <CardContent className="p-5 space-y-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="w-[120px]">Price</TableHead>
                                    <TableHead className="w-[120px]">Duration</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={`skeleton-${i}`}>
                                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : items.length === 0 ? (
                                    <TableRow key="no-data">
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No memberships found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item, index) => (
                                        <TableRow key={item.id || `membership-${index}`}>
                                            <TableCell className="font-medium text-xs text-muted-foreground">
                                                {(page - 1) * limit + index + 1}
                                            </TableCell>
                                            <TableCell className="font-semibold">{item.name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-md truncate" title={item.description}>
                                                {item.description || '-'}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {item.price_usd ? `$${item.price_usd}` : '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {item.duration_days ? `${item.duration_days} days` : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem onClick={() => handleViewMembership(item.id)} className='cursor-pointer'>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild className='cursor-pointer'>
                                                            <Link href={`/crm/memberships/edit/${item.id}`} className="flex items-center w-full" >
                                                                <Edit2 className="w-4 h-4 mr-2" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onClick={() => handleDeleteMembership(item.id)} className='cursor-pointer'
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

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 py-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">Rows per page</span>
                            <Select
                                value={limit.toString()}
                                onValueChange={(value) => {
                                    setLimit(Number(value));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={limit.toString()} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 50, 100].map((pageSize) => (
                                        <SelectItem key={pageSize} value={pageSize.toString()}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => handlePageChange(page - 1)}
                                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </PaginationItem>

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                                    .map((p, i, arr) => (
                                        <React.Fragment key={p}>
                                            {i > 0 && arr[i - 1] !== p - 1 && (
                                                <PaginationItem>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            )}
                                            <PaginationItem>
                                                <PaginationLink
                                                    isActive={page === p}
                                                    onClick={() => handlePageChange(p)}
                                                    className="cursor-pointer"
                                                >
                                                    {p}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </React.Fragment>
                                    ))}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => handlePageChange(page + 1)}
                                        className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </CardContent>
            </Card>

            <ConfirmDialog
                isOpen={confirmDialog}
                onOpenChange={setConfirmDialog}
                title="Delete Membership?"
                description="Are you sure you want to delete this Membership? This action cannot be undone."
                confirmText={isDeleting ? "Deleting..." : "Delete Membership"}
                variant="destructive"
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};

export default MembershipsPage;