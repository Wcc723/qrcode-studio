export interface PhoneInputData { number: string }
export function buildPhone({ number }: PhoneInputData): string {
  const cleaned = number.replace(/[\s-]/g, '')
  return cleaned ? `tel:${cleaned}` : ''
}
