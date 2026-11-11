import { revalidatePath } from "next/cache";

export function revalidateListingPages(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath("/map");
  revalidatePath("/sold");
  if (slug) revalidatePath(`/${slug}`);
}
