import { redirect } from 'next/navigation';

export default function RegisterPage() {
  redirect('/login?admin_only=1');
}
