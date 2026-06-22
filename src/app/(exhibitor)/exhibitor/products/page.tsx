import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import {
  getMyExhibitorProfile,
  getExhibitorProducts,
} from "@/features/exhibitors/actions";
import { ProductsClient } from "./ProductsClient";

export default async function ProductsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const exhibitor = await getMyExhibitorProfile();
  if (!exhibitor) redirect("/exhibitor/profile");

  const products = await getExhibitorProducts(exhibitor.id);
  return <ProductsClient exhibitor={exhibitor} products={products} />;
}
