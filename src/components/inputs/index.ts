import type { QrType } from '@/types'
import type { Component } from 'vue'
import UrlInput from './UrlInput.vue'
import TextInput from './TextInput.vue'
import WifiInput from './WifiInput.vue'
import VCardInput from './VCardInput.vue'
import EmailInput from './EmailInput.vue'
import PhoneInput from './PhoneInput.vue'
import SmsInput from './SmsInput.vue'

export const inputComponents: Record<QrType, Component> = {
  url: UrlInput, text: TextInput, wifi: WifiInput, vcard: VCardInput,
  email: EmailInput, phone: PhoneInput, sms: SmsInput,
}
