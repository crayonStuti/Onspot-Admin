'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routeMap: Record<string, string> = {
    crm: 'CRM',
    users: 'Users',
    company: 'Company',
    companies: 'Companies',
    contacts: 'Contacts',
    tasks: 'Tasks',
    notes: 'Notes',
    dashboard: 'Dashboard',
};

export function HeaderBreadcrumb() {
    const pathname = usePathname();
    const pathSegments = pathname.split('/').filter(Boolean);

    return (
        <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
                {pathSegments.map((segment, index) => {
                    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathSegments.length - 1;
                    const label = routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

                    return (
                        <React.Fragment key={href}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                    );
                })}
                {pathname === '/crm/users' && (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>User List</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                )}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
