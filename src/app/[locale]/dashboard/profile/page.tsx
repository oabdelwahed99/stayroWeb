import { setRequestLocale } from "next-intl/server";
import { getProfileData } from "@/lib/actions/profile";
import { ProfileForm } from "@/components/profile/profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await getProfileData();
  return <ProfileForm user={data.user} profile={data.profile} />;
}
