import { notFound } from "next/navigation";

import {
  creditFragments,
  getCreditFragmentBySlug,
} from "@/app/components/credits/creditData";

type CreditDetailPageProps = {
  params: Promise<{ fragmentSlug: string }>;
};

export function generateStaticParams() {
  return creditFragments.map((fragment) => ({
    fragmentSlug: fragment.slug,
  }));
}

export default async function CreditDetailPage({
  params,
}: CreditDetailPageProps) {
  const { fragmentSlug } = await params;
  const fragment = getCreditFragmentBySlug(fragmentSlug);

  if (!fragment) {
    notFound();
  }

  return null;
}
