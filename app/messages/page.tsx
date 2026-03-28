import { Suspense } from "react";
import MessagesPageClient from "./MessagesPageClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading messages...</div>}>
      <MessagesPageClient />
    </Suspense>
  );
}