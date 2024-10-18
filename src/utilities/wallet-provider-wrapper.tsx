import { useEffect, useState } from "react";
import {
  AllDefaultWallets,
  WalletProvider,
  defineStashedWallet,
} from "@suiet/wallet-kit";

const stashedWalletConfig = defineStashedWallet({
  appName: "rootlets",
});

const WalletProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <WalletProvider
      defaultWallets={[...AllDefaultWallets, stashedWalletConfig]}
      autoConnect
    >
      {children}
    </WalletProvider>
  );
};

export default WalletProviderWrapper;
