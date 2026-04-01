'use client'

import { FilterChips, type FilterChipItem } from '@/components/filter-chips'
import type { PaginationChipItem } from '@/lib/pagination'

export function PaginationBar({
  items,
  selectedValue,
  summary,
  title = 'Pages',
  description = 'Browse the available records page by page.',
}: {
  items: PaginationChipItem[]
  selectedValue: string
  summary: string
  title?: string
  description?: string
}) {
  if (!items.length) {
    return null
  }

  return (
    <div className="card">
      <div className="section-heading">
        <div>
          <h4>{title}</h4>
          <p className="muted">{description}</p>
        </div>
        <span className="badge">{summary}</span>
      </div>
      <FilterChips items={items as FilterChipItem[]} selectedValue={selectedValue} mode="link" />
    </div>
  )
}
