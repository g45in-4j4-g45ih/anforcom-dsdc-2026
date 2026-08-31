import { redirect } from "next/navigation";

// No dedicated homepage yet, so "/" lands on the Material Exchange page -
// it's the only fully-built landing-style page right now (hero banners,
// browse grid). /items is meant to be the general browse-everything page
// per the navbar, but that route doesn't exist yet - route here instead
// once it's built.
export default function Home() {
  redirect("/materials");
}
