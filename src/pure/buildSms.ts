export interface SmsInputData { number: string; message: string }
export function buildSms({ number, message }: SmsInputData): string {
  const cleaned = number.replace(/[\s-]/g, '')
  return cleaned ? `SMSTO:${cleaned}:${message}` : ''
}
