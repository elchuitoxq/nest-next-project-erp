"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NAV_ITEMS, type NavItem, type NavSubItem } from "@/lib/navigation";
import React from "react";

interface DynamicBreadcrumbProps {
  customLabels?: Record<string, string>;
}

export function DynamicBreadcrumb({ customLabels }: DynamicBreadcrumbProps) {
  const pathname = usePathname();

  // Split path into segments and remove empty ones
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const url = `/${segments.slice(0, index + 1).join("/")}`;

    // 1. Try to find in NAV_ITEMS (Top level)
    let title = NAV_ITEMS.find((item) => item.url === url)?.title;

    // 2. Try to find in NAV_ITEMS sub-items
    if (!title) {
      for (const parent of NAV_ITEMS) {
        const subItem = parent.items?.find((sub) => sub.url === url);
        if (subItem) {
          title = subItem.title;
          break;
        }
      }
    }

    // 3. Fallback to custom label or prettified segment
    if (!title) {
      if (customLabels && customLabels[segment]) {
        title = customLabels[segment];
      } else {
        // Handle common dynamic IDs or special segments
        if (segment === "dashboard") title = "ERP";
        else {
          title =
            segment.charAt(0).toUpperCase() +
            segment.slice(1).replace(/-/g, " ");
        }
      }
    }

    return {
      title,
      url,
      isLast: index === segments.length - 1,
    };
  });

  // If we're just at root or dashboard, we might want a base "Dashboard" link
  // but usually segments already includes 'dashboard' which we mapped to 'ERP'

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.url}>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.url}>{crumb.title}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!crumb.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
