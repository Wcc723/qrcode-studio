export type WifiEncryption = 'WPA' | 'WEP' | 'nopass'
export interface WifiInputData {
  ssid: string
  password: string
  encryption: WifiEncryption
  hidden: boolean
}

function esc(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

export function buildWifi({ ssid, password, encryption, hidden }: WifiInputData): string {
  if (!ssid.trim()) return ''
  const t = encryption
  const p = encryption === 'nopass' ? '' : esc(password)
  return `WIFI:T:${t};S:${esc(ssid)};P:${p};H:${hidden};;`
}
