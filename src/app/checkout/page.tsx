import type { Metadata } from 'next'
import CheckoutContent from './CheckoutContent'

export const metadata: Metadata = { title: 'Checkout — KreaFlow' }

export default function CheckoutPage() {
  return <CheckoutContent />
}
