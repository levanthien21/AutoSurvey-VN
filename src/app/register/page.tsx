import { redirect } from 'next/navigation';

export default function RegisterPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const ref = searchParams?.ref || searchParams?.referral;
  if (ref) {
    redirect(`/login?tab=register&ref=${encodeURIComponent(String(ref))}`);
  }
  redirect('/login?tab=register');
}
