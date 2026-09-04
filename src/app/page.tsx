import { redirect } from "next/navigation";

/** Root simply forwards to the main app screen; middleware handles auth. */
export default function Home() {
  redirect("/bolos");
}
