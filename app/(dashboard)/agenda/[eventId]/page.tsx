import EventDetailClient from './page-client';
import { fetchStaticParams } from '@/lib/static-params';

export async function generateStaticParams() {
  return fetchStaticParams('evenements', 'eventId');
}

export default function Page() {
  return <EventDetailClient />;
}
