import {
  Home,
} from 'lucide-react';
import { ContentHeader } from '@/components/layouts/crm/components/content-header';

export function PageHeader() {
  return (
    <ContentHeader className="space-x-2">
      <h1 className="inline-flex items-center gap-2.5 text-sm font-semibold">
        <Home className="size-4 text-primary" /> Dashboard
      </h1>
    </ContentHeader>
  );
}
