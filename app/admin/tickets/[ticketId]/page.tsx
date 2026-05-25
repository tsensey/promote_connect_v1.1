import TicketAdminClient from './page-client';
import { fetchStaticParams } from '@/lib/static-params';

export async function generateStaticParams() {
  return fetchStaticParams('support_tickets', 'ticketId');
}

export default function Page() {
  return <TicketAdminClient />;
}
