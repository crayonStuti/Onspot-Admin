import {
  BriefcaseBusiness,
  Building2,
  CheckSquare,
  CircleEllipsis,
  GalleryVerticalEnd,
  Home,
  Users,
  Library,
  MapPin,
  Images,
  Map,
  CreditCard,
  History,
  FileText
} from 'lucide-react';
import { NavConfig } from './types';

export const MAIN_NAV: NavConfig = [
  {
    title: 'Dashboard',
    icon: Home,
    path: '/crm/dashboard',
    id: 'dashboard',
  },
  {
    title: 'Users',
    icon: Users,
    id: 'users',
    items: [
      {
        title: 'User List',
        path: '/crm/users',
        id: 'user-list',
      },
    ],
  },
  {
    title: 'Resources',
    icon: Library,
    id: 'resources',
    items: [
      {
        title: 'Resource List',
        path: '/crm/resources',
        id: 'resource-list',
      },
    ],
  },
  {
    title: 'Map Pins',
    icon: MapPin,
    id: 'map-pins',
    items: [
      {
        title: 'Map Pins List',
        path: '/crm/map-pins',
        id: 'map-pin-list',
      },
    ],
  },
  {
    title: 'Gallery',
    icon: Images,
    id: 'gallery',
    items: [
      {
        title: 'Gallery List',
        path: '/crm/gallery',
        id: 'gallery-list',
      },
    ],
  },
  {
    title: 'States',
    icon: Map,
    id: 'states',
    items: [
      {
        title: 'States List',
        path: '/crm/states',
        id: 'states-list',
      },
    ],
  },
  {
    title: 'Memberships',
    icon: CreditCard,
    id: 'memberships',
    items: [
      {
        title: 'Membership List',
        path: '/crm/memberships',
        id: 'memberships-list',
      },
    ],
  },
  {
    title: 'License Issuers',
    icon: FileText,
    id: 'license-issuers',
    items: [
      {
        title: 'License Issuers List',
        path: '/crm/license-issuers',
        id: 'license-issuers-list',
      },
    ],
  }
];
