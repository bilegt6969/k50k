import { groq } from 'next-sanity'

import { globEscapeForGroqMatch } from '@/lib/groq-glob-escape'

export const ADMIN_ORDER_STATUSES = [
  'PendingPayment',
  'Paid',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
] as const

export type AdminOrderStatus = (typeof ADMIN_ORDER_STATUSES)[number]

export const PAGE_SIZE = 25

export type OrderListSearchInput = {
  q?: string | string[] | undefined
  status?: string | string[] | undefined
  page?: string | string[] | undefined
  queue?: string | string[] | undefined
}

export type ParsedOrderListFilters = {
  q: string
  status: AdminOrderStatus | ''
  queue: 'fulfillment' | ''
  page: number
}

function first(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? ''
  return v ?? ''
}

export function parseOrderListSearchParams(input: OrderListSearchInput): ParsedOrderListFilters {
  const q = first(input.q).trim()
  const statusRaw = first(input.status)
  const status = ADMIN_ORDER_STATUSES.includes(statusRaw as AdminOrderStatus)
    ? (statusRaw as AdminOrderStatus)
    : ''
  const queue = first(input.queue) === 'fulfillment' ? ('fulfillment' as const) : ''
  const pageRaw = parseInt(first(input.page), 10)
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1
  return { q, status, queue, page }
}

/** Placeholder glob when there is no search text (avoids `*` matching everything if both branches run). */
const NO_TEXT_MATCH_PATTERN = '*\u200c__no_text_filter__\u200d*'

/** GROQ filter params for list + count + export */
export function orderListGroqBindings(filters: ParsedOrderListFilters) {
  const noTextFilter = filters.q.length === 0
  const qPattern = noTextFilter ? NO_TEXT_MATCH_PATTERN : `*${globEscapeForGroqMatch(filters.q)}*`
  const anyStatus = filters.status === ''
  const singleStatus = filters.status || null
  const useFulfillmentQueue = !filters.status && filters.queue === 'fulfillment'
  return {
    qPattern,
    noTextFilter,
    anyStatus,
    singleStatus,
    useFulfillmentQueue,
  }
}

/** Uses `match` (not `string::contains`) for API 2024-01-01 compatibility. */
export const ORDER_LIST_FILTER = groq`(
  _type == "order"
  && select(
    $noTextFilter => true,
    lower(coalesce(orderNumber, "")) match lower($qPattern)
      || lower(coalesce(email, "")) match lower($qPattern)
      || lower(coalesce(customerName, "")) match lower($qPattern)
  )
  && ($anyStatus || orderStatus == $singleStatus)
  && (!$useFulfillmentQueue || orderStatus in ["PendingPayment", "Paid", "Processing"])
)`

export function buildOrderListCountQuery() {
  return groq`count(*[${ORDER_LIST_FILTER}])`
}

export function buildOrderListRowsQuery() {
  return groq`*[${ORDER_LIST_FILTER}] | order(coalesce(dateTime(createdAt), _createdAt) desc) [$start...$end] {
  _id,
  orderNumber,
  customerName,
  email,
  orderStatus,
  totalAmount,
  createdAt,
  "itemCount": count(items)
}`
}

export function buildOrderListExportQuery() {
  return groq`*[${ORDER_LIST_FILTER}] | order(coalesce(dateTime(createdAt), _createdAt) desc) {
  orderNumber,
  customerName,
  email,
  orderStatus,
  totalAmount,
  createdAt,
  "itemCount": count(items)
}`
}
