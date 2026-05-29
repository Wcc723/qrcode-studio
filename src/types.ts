export type QrType = 'url' | 'text' | 'wifi' | 'vcard' | 'email' | 'phone' | 'sms'
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

export interface QrStyleOptions {
  width: number
  margin: number
  errorCorrectionLevel: ErrorCorrectionLevel
  dotColor: string
  bgColor: string            // 允許 'transparent'
  useGradient: boolean
  gradientColor: string
  gradientType: 'linear' | 'radial'
  logoDataUrl: string | null
  logoSize: number           // 0–0.4，對應 qr-code-styling imageSize
}

export const defaultStyle: QrStyleOptions = {
  width: 1000,
  margin: 8,
  errorCorrectionLevel: 'M',
  dotColor: '#1e293b',
  bgColor: '#ffffff',
  useGradient: false,
  gradientColor: '#4f46e5',
  gradientType: 'linear',
  logoDataUrl: null,
  logoSize: 0.3,
}
