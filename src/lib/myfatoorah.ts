/**
 * MyFatoorah payment gateway client (server-side only).
 * Docs: https://docs.myfatoorah.com
 */

const BASE_URL = process.env.MYFATOORAH_BASE_URL ?? 'https://apitest.myfatoorah.com'
const API_KEY  = process.env.MYFATOORAH_API_KEY  ?? ''

function authHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  }
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface MFPaymentMethod {
  PaymentMethodId:   number
  PaymentMethodAr:   string
  PaymentMethodEn:   string
  IsEmbeddedSupported: boolean
  ServiceCharge:     number
  TotalAmount:       number
}

export interface MFExecuteResult {
  invoiceId:  number
  invoiceUrl: string
}

export interface MFPaymentStatus {
  InvoiceStatus:     string   // 'Paid' | 'Unpaid' | 'Failed' | 'Expired'
  CustomerReference: string   // "userId:tier" we set at payment creation
  InvoiceId:         number
  InvoiceValue:      number
}

// ── InitiatePayment ────────────────────────────────────────────────────────
// Returns available payment methods for the given amount/currency.

export async function initiatePayment(
  amount: number,
  currencyIso = 'KWD',
): Promise<MFPaymentMethod[]> {
  const res = await fetch(`${BASE_URL}/v2/InitiatePayment`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ InvoiceAmount: amount, CurrencyIso: currencyIso }),
    cache: 'no-store',
  })
  const data = await res.json()
  if (!data.IsSuccess) throw new Error(data.Message ?? 'InitiatePayment failed')
  return data.Data.PaymentMethods as MFPaymentMethod[]
}

// ── ExecutePayment ─────────────────────────────────────────────────────────
// Creates an invoice and returns the hosted payment page URL.

export async function executePayment(params: {
  paymentMethodId: number
  invoiceValue:    number
  customerEmail:   string
  customerName:    string
  callbackUrl:     string
  errorUrl:        string
  customerReference: string   // "userId:tier" — returned in status callback
}): Promise<MFExecuteResult> {
  const res = await fetch(`${BASE_URL}/v2/ExecutePayment`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      PaymentMethodId:   params.paymentMethodId,
      CustomerName:      params.customerName || 'FinTrack User',
      DisplayCurrencyIso: 'KWD',
      MobileCountryCode: '+965',
      CustomerMobile:    '12345678',
      CustomerEmail:     params.customerEmail,
      InvoiceValue:      params.invoiceValue,
      CallBackUrl:       params.callbackUrl,
      ErrorUrl:          params.errorUrl,
      Language:          'en',
      CustomerReference: params.customerReference,
      UserDefinedField:  params.customerReference,
      SourceInfo:        'FinTrack',
    }),
    cache: 'no-store',
  })
  const data = await res.json()
  if (!data.IsSuccess) throw new Error(data.Message ?? 'ExecutePayment failed')
  // API returns "PaymentURL" (not "InvoiceURL") for the hosted checkout page
  return {
    invoiceId:  data.Data.InvoiceId   as number,
    invoiceUrl: data.Data.PaymentURL  as string,
  }
}

// ── GetPaymentStatus ───────────────────────────────────────────────────────
// Verify a payment using the PaymentId from the MyFatoorah callback URL.

export async function getPaymentStatus(paymentId: string): Promise<MFPaymentStatus> {
  const res = await fetch(`${BASE_URL}/v2/GetPaymentStatus`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ Key: paymentId, KeyType: 'PaymentId' }),
    cache: 'no-store',
  })
  const data = await res.json()
  if (!data.IsSuccess) throw new Error(data.Message ?? 'GetPaymentStatus failed')
  const d = data.Data
  return {
    InvoiceStatus:     d.InvoiceStatus,
    CustomerReference: d.CustomerReference ?? d.UserDefinedField ?? '',
    InvoiceId:         d.InvoiceId,
    InvoiceValue:      d.InvoiceValue,
  }
}
