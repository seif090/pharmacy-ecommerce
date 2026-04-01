import type { ReactNode } from 'react'

export type PaginationChipItem = {
  value: string
  label: ReactNode
  href?: string
  disabled?: boolean
}

export function buildPaginationItems(
  currentPage: number,
  totalPages: number,
  buildHref: (page: number) => string,
): PaginationChipItem[] {
  if (totalPages <= 1) {
    return []
  }

  const items: PaginationChipItem[] = []

  items.push({
    value: 'prev',
    label: 'Previous',
    href: buildHref(Math.max(1, currentPage - 1)),
    disabled: currentPage <= 1,
  })

  const addPage = (page: number) => {
    items.push({
      value: String(page),
      label: String(page),
      href: buildHref(page),
    })
  }

  const addEllipsis = (key: string) => {
    items.push({
      value: key,
      label: '...',
      disabled: true,
    })
  }

  addPage(1)

  if (totalPages > 1) {
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    if (start > 2) {
      addEllipsis('start')
    }

    for (let page = start; page <= end; page += 1) {
      addPage(page)
    }

    if (end < totalPages - 1) {
      addEllipsis('end')
    }

    addPage(totalPages)
  }

  items.push({
    value: 'next',
    label: 'Next',
    href: buildHref(Math.min(totalPages, currentPage + 1)),
    disabled: currentPage >= totalPages,
  })

  return items
}

export function buildPaginationSummary(currentPage: number, totalPages: number, total: number) {
  const resultLabel = total === 1 ? 'result' : 'results'
  return `Page ${currentPage} of ${totalPages} - ${total} ${resultLabel}`
}
