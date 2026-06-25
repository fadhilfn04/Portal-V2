import type { Metadata } from 'next'
import { WhatsAppSubscribersManager } from '@/components/admin/whatsapp-subscribers-manager'

export const metadata: Metadata = {
  title: 'WhatsApp Subscribers',
  description: 'Kelola nomor WhatsApp yang berlangganan update',
}

export default function WhatsAppSubscribersPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <WhatsAppSubscribersManager />
    </div>
  )
}
