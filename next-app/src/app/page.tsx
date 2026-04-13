import WeddingApp from "./components/WeddingApp";
import { ConfirmProvider } from "./components/ui/ConfirmModal";
import { LoadingProvider } from "./components/ui/LoadingOverlay";

export default function Home() {
  return (
    <LoadingProvider>
      <ConfirmProvider>
        <WeddingApp />
      </ConfirmProvider>
    </LoadingProvider>
  );
}
