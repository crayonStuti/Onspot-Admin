'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronLeft, ChevronRight, GraduationCap, ShieldCheck, History } from 'lucide-react';
import { getAuthToken } from '@/service/service';
import { getAuthLogs, getAdminActions } from '@/lib/actions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const LogsPage = () => {
    const [activeTab, setActiveTab] = useState('auth');
    const [authLogs, setAuthLogs] = useState<any[]>([]);
    const [adminActions, setAdminActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(10);

    const fetchLogs = React.useCallback(async () => {
        setLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            let response;
            if (activeTab === 'auth') {
                response = await getAuthLogs(token, page, limit, searchTerm);
                if (response && response.data) {
                    setAuthLogs(response.data.logs || []);
                    setTotalPages(response.data.pagination?.totalPages || 1);
                    setTotalItems(response.data.pagination?.totaldata || 0);
                }
            } else {
                response = await getAdminActions(token, page, limit, searchTerm);
                if (response && response.data) {
                    setAdminActions(response.data.actions || []);
                    setTotalPages(response.data.pagination?.totalPages || 1);
                    setTotalItems(response.data.pagination?.totaldata || 0);
                }
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    }, [activeTab, page, limit, searchTerm]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchTerm(email);
        setPage(1);
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setPage(1);
        setEmail('');
        setSearchTerm('');
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <History className="w-6 h-6 text-blue-600" />
                    System Logs
                </h1>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="auth" className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Auth Logs
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Admin Actions
                    </TabsTrigger>
                </TabsList>

                <Card className="mt-6 border shadow-sm">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle className="text-lg font-medium whitespace-nowrap">
                                {activeTab === 'auth' ? 'Authentication Logs' : 'Admin Actions'}
                            </CardTitle>
                            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by email..."
                                        className="pl-9"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" variant="secondary">Search</Button>
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {activeTab === 'auth' ? (
                                            <>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Action</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Date & Time</TableHead>
                                            </>
                                        ) : (
                                            <>
                                                <TableHead>Admin</TableHead>
                                                <TableHead>Action Type</TableHead>
                                                <TableHead>Target Table</TableHead>
                                                <TableHead>Target Name</TableHead>
                                                <TableHead>Date & Time</TableHead>
                                            </>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                                {activeTab === 'admin' && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                                            </TableRow>
                                        ))
                                    ) : (
                                        (activeTab === 'auth' ? authLogs : adminActions).length > 0 ? (
                                            (activeTab === 'auth' ? authLogs : adminActions).map((log) => (
                                                <TableRow key={log.id}>
                                                    {activeTab === 'auth' ? (
                                                        <>
                                                            <TableCell className="font-medium">{log.email}</TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant={
                                                                        log.action === 'LOGIN' ? 'success' :
                                                                            log.action === 'REGISTER' ? 'primary' :
                                                                                log.action === 'LOGOUT' ? 'secondary' :
                                                                                    log.action === 'PASSWORD_CHANGE' ? 'info' :
                                                                                        'outline'
                                                                    }
                                                                    appearance="light"
                                                                    className="font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap"
                                                                >
                                                                    {log.action.replace('_', ' ')}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant={log.status === 'SUCCESS' ? 'success' : 'destructive'}
                                                                    appearance="light"
                                                                >
                                                                    {log.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                                                            </TableCell>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{log.admin?.display_name || log.admin?.username}</span>
                                                                    <span className="text-xs text-muted-foreground">{log.admin?.email}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant={
                                                                        log.action_type === 'CREATE' ? 'success' :
                                                                            log.action_type === 'UPDATE' ? 'info' :
                                                                                log.action_type === 'DELETE' ? 'destructive' :
                                                                                    'secondary'
                                                                    }
                                                                    className="capitalize"
                                                                    appearance="light"
                                                                >
                                                                    {log.action_type}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs">{log.target_table}</TableCell>
                                                            <TableCell className="font-medium">{log.target_name}</TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                                                            </TableCell>
                                                        </>
                                                    )}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={activeTab === 'auth' ? 4 : 5} className="h-24 text-center text-muted-foreground">
                                                    No logs found.
                                                </TableCell>
                                            </TableRow>
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 mt-2">
                    <div className="text-sm text-muted-foreground">
                        Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalItems)} of {totalItems} entries
                    </div>
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

                            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <PaginationItem key={i}>
                                        <Button
                                            variant={page === pageNum ? 'primary' : 'ghost'}
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setPage(pageNum)}
                                        >
                                            {pageNum}
                                        </Button>
                                    </PaginationItem>
                                );
                            })}

                            {totalPages > 5 && <PaginationItem><PaginationEllipsis /></PaginationItem>}

                            <PaginationItem>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || totalPages === 0}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </Tabs>
        </div>
    );
};

export default LogsPage;
