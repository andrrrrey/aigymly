import 'server-only'
import crypto from 'crypto'
import https from 'https'
import tls from 'tls'
import fs from 'fs'

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

// T-Bank's TLS chain is rooted at the Russian Trusted Root CA (Минцифры), which
// is absent from Node's bundled trust store. Point TBANK_CA_CERT_PATH at a PEM
// with that root (and sub CA) to trust it — added ON TOP of the default roots,
// never replacing them. When unset, the default trust store is used (so a
// process-level NODE_EXTRA_CA_CERTS keeps working). We never disable TLS checks.
let cachedAgent: https.Agent | null | undefined

function getTbankHttpsAgent(): https.Agent | undefined {
  if (cachedAgent !== undefined) return cachedAgent ?? undefined

  const caPath = process.env.TBANK_CA_CERT_PATH?.trim()
  if (!caPath) {
    cachedAgent = null
    return undefined
  }
  try {
    const extra = fs.readFileSync(caPath, 'utf8')
    cachedAgent = new https.Agent({
      ca: [...tls.rootCertificates, extra],
      keepAlive: true,
    })
  } catch (err) {
    console.error('[tbank] failed to load TBANK_CA_CERT_PATH', err)
    cachedAgent = null
  }
  return cachedAgent ?? undefined
}

async function tbankRequest<T = Record<string, unknown>>(
  method: string,
  body: Record<string, unknown>
): Promise<T> {
  const payload = JSON.stringify(body)

  const raw = await new Promise<{ status: number; text: string }>((resolve, reject) => {
    const req = https.request(
      `${TBANK_BASE_URL}/${method}`,
      {
        method: 'POST',
        agent: getTbankHttpsAgent(),
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 30_000,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c) => chunks.push(c as Buffer))
        res.on('end', () =>
          resolve({ status: res.statusCode ?? 0, text: Buffer.concat(chunks).toString('utf8') })
        )
      }
    )
    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('request timed out')))
    req.write(payload)
    req.end()
  }).catch((err) => {
    throw new TbankError('TBANK_REQUEST_FAILED', `network error calling ${method}`, err)
  })

  let json: Record<string, unknown>
  try {
    json = JSON.parse(raw.text) as Record<string, unknown>
  } catch (err) {
    throw new TbankError('TBANK_REQUEST_FAILED', `bad JSON from ${method}`, err)
  }

  if (raw.status < 200 || raw.status >= 300) {
    throw new TbankError('TBANK_REQUEST_FAILED', `HTTP ${raw.status} from ${method}`, json)
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
