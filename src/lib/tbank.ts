import 'server-only'
import crypto from 'crypto'

// T-Bank (Tinkoff) internet-acquiring client.
//
// The production and sandbox environments share the same endpoint; the
// environment is selected purely by which TerminalKey/Password pair is used.
// See https://developer.tbank.ru/eacq/api for the full reference.
export const TBANK_BASE_URL = 'https://securepay.tinkoff.ru/v2'

export type TbankErrorCode =
  | 'TBANK_NOT_CONFIGURED'
  | 'TBANK_REQUEST_FAILED'
  | 'TBANK_REJECTED'

export class TbankError extends Error {
  code: TbankErrorCode
  details?: unknown
  constructor(code: TbankErrorCode, message?: string, details?: unknown) {
    super(message ?? code)
    this.code = code
    this.details = details
  }
}

// A scalar request value that participates in the signature.
type TokenScalar = string | number | boolean

/**
 * Builds the T-Bank request/notification signature (Token).
 *
 * Algorithm: take only the root-level scalar fields (nested objects such as
 * `Receipt`/`DATA` and the `Token` field itself are excluded), add a
 * `Password` pair, sort the pairs by key, concatenate the values into a single
 * string, and hash it with SHA-256 (lowercase hex). Booleans are stringified
 * as "true"/"false".
 */
export function buildToken(
  params: Record<string, TokenScalar | undefined | null>,
  password: string
): string {
  const entries: [string, string][] = [['Password', password]]

  for (const [key, value] of Object.entries(params)) {
    if (key === 'Token') continue
    if (value === undefined || value === null) continue
    if (typeof value === 'object') continue // skip nested Receipt / DATA
    entries.push([key, typeof value === 'boolean' ? String(value) : String(value)])
  }

  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  const concatenated = entries.map(([, v]) => v).join('')
  return crypto.createHash('sha256').update(concatenated, 'utf8').digest('hex')
}

/**
 * Verifies the Token on an incoming webhook notification. The notification body
 * may contain non-scalar or extra fields; only root scalars are signed.
 */
export function verifyNotificationToken(
  body: Record<string, unknown>,
  password: string
): boolean {
  const received = typeof body.Token === 'string' ? body.Token : ''
  if (!received) return false

  const scalars: Record<string, TokenScalar> = {}
  for (const [key, value] of Object.entries(body)) {
    if (key === 'Token') continue
    if (value === null || value === undefined) continue
    if (typeof value === 'object') continue
    scalars[key] = value as TokenScalar
  }

  const expected = buildToken(scalars, password)
  // Constant-time comparison.
  const a = Buffer.from(expected)
  const b = Buffer.from(received.toLowerCase())
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

async function tbankRequest<T = Record<string, unknown>>(
  method: string,
  body: Record<string, unknown>
): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${TBANK_BASE_URL}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
  } catch (err) {
    throw new TbankError('TBANK_REQUEST_FAILED', `network error calling ${method}`, err)
  }

  let json: Record<string, unknown>
  try {
    json = (await res.json()) as Record<string, unknown>
  } catch (err) {
    throw new TbankError('TBANK_REQUEST_FAILED', `bad JSON from ${method}`, err)
  }

  if (!res.ok) {
    throw new TbankError('TBANK_REQUEST_FAILED', `HTTP ${res.status} from ${method}`, json)
  }
  return json as T
}

export interface TbankCredentials {
  terminalKey: string
  password: string
}

export interface ReceiptItem {
  Name: string
  Price: number
  Quantity: number
  Amount: number
  Tax: string
}

export interface Receipt {
  Email?: string
  Taxation: string
  Items: ReceiptItem[]
}

/**
 * Builds a single-item fiscal receipt (54-ФЗ) for a subscription purchase.
 * `amountKopecks` is the full price; the receipt has one line for the plan.
 */
export function buildReceipt(opts: {
  name: string
  amountKopecks: number
  taxation: string
  vat: string
  email?: string | null
}): Receipt {
  const item: ReceiptItem = {
    Name: opts.name.slice(0, 128),
    Price: opts.amountKopecks,
    Quantity: 1,
    Amount: opts.amountKopecks,
    Tax: opts.vat,
  }
  return {
    ...(opts.email ? { Email: opts.email } : {}),
    Taxation: opts.taxation,
    Items: [item],
  }
}

export interface InitParams {
  amountKopecks: number
  orderId: string
  description?: string
  customerKey?: string
  recurrent?: boolean
  notificationUrl?: string
  successUrl?: string
  failUrl?: string
  receipt?: Receipt
}

export interface InitResult {
  Success: boolean
  ErrorCode?: string
  Message?: string
  Details?: string
  PaymentId?: string
  PaymentURL?: string
  Status?: string
  OrderId?: string
}

// Init creates a payment and returns a PaymentURL for the payment form.
export async function tbankInit(
  creds: TbankCredentials,
  params: InitParams
): Promise<InitResult> {
  const base: Record<string, unknown> = {
    TerminalKey: creds.terminalKey,
    Amount: params.amountKopecks,
    OrderId: params.orderId,
  }
  if (params.description) base.Description = params.description.slice(0, 250)
  if (params.customerKey) base.CustomerKey = params.customerKey
  if (params.recurrent) base.Recurrent = 'Y'
  if (params.notificationUrl) base.NotificationURL = params.notificationUrl
  if (params.successUrl) base.SuccessURL = params.successUrl
  if (params.failUrl) base.FailURL = params.failUrl

  const token = buildToken(base as Record<string, TokenScalar>, creds.password)

  const payload: Record<string, unknown> = { ...base, Token: token }
  if (params.receipt) payload.Receipt = params.receipt

  const result = await tbankRequest<InitResult>('Init', payload)
  if (!result.Success) {
    throw new TbankError('TBANK_REJECTED', result.Message || 'Init rejected', result)
  }
  return result
}

export interface ChargeResult {
  Success: boolean
  ErrorCode?: string
  Message?: string
  PaymentId?: string
  Status?: string
  OrderId?: string
}

// Charge performs an off-session recurring payment against a saved RebillId.
// It must follow an Init (without Recurrent) that produced the PaymentId.
export async function tbankCharge(
  creds: TbankCredentials,
  opts: { paymentId: string; rebillId: string }
): Promise<ChargeResult> {
  const base: Record<string, TokenScalar> = {
    TerminalKey: creds.terminalKey,
    PaymentId: opts.paymentId,
    RebillId: opts.rebillId,
    // Merchant-initiated recurring transaction (COF/MIT).
    OperationInitiatorType: 'R',
  }
  const token = buildToken(base, creds.password)
  const result = await tbankRequest<ChargeResult>('Charge', { ...base, Token: token })
  if (!result.Success) {
    throw new TbankError('TBANK_REJECTED', result.Message || 'Charge rejected', result)
  }
  return result
}

export interface GetStateResult {
  Success: boolean
  Status?: string
  PaymentId?: string
  OrderId?: string
  Amount?: number
  Message?: string
}

export async function tbankGetState(
  creds: TbankCredentials,
  paymentId: string
): Promise<GetStateResult> {
  const base: Record<string, TokenScalar> = {
    TerminalKey: creds.terminalKey,
    PaymentId: paymentId,
  }
  const token = buildToken(base, creds.password)
  return tbankRequest<GetStateResult>('GetState', { ...base, Token: token })
}
