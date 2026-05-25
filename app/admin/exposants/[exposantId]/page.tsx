import ExposantAdminClient from './page-client';
import { fetchStaticParams } from '@/lib/static-params';

export async function generateStaticParams() {
  return fetchStaticParams('exposants', 'exposantId');
}

export default function Page() {
  return <ExposantAdminClient />;
}
