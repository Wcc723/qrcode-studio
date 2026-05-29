import type { QrType } from '@/types'
import { buildUrl, type UrlInputData } from './buildUrl'
import { buildText, type TextInputData } from './buildText'
import { buildWifi, type WifiInputData } from './buildWifi'
import { buildVCard, type VCardInputData } from './buildVCard'
import { buildEmail, type EmailInputData } from './buildEmail'
import { buildPhone, type PhoneInputData } from './buildPhone'
import { buildSms, type SmsInputData } from './buildSms'

export type PayloadInputMap = {
  url: UrlInputData; text: TextInputData; wifi: WifiInputData; vcard: VCardInputData
  email: EmailInputData; phone: PhoneInputData; sms: SmsInputData
}

const builders = {
  url: buildUrl, text: buildText, wifi: buildWifi, vcard: buildVCard,
  email: buildEmail, phone: buildPhone, sms: buildSms,
} as const

export function buildPayload<T extends QrType>(type: T, data: PayloadInputMap[T]): string {
  return (builders[type] as (d: PayloadInputMap[T]) => string)(data)
}

export * from './buildUrl'; export * from './buildText'; export * from './buildWifi'
export * from './buildVCard'; export * from './buildEmail'; export * from './buildPhone'; export * from './buildSms'
