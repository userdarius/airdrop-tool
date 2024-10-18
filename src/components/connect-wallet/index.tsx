import { Button } from "@/components/ui/button";
import { useState } from "react";
import { WalletsIconMapper } from "@/utilities/list";
import { useWallet } from "@suiet/wallet-kit";
import { useMemo } from "react";
import Image from "next/image";
import { useWalletKit } from "@/lib/sui";
import Modal from "@/components/modal";

const DisabledWallets = [
  "Elli",
  "Frontier Wallet",
  "OneKey Wallet",
  "Sensui Wallet",
  "Spacecy Sui Wallet",
  "TokenPocket Wallet",
  "Surf Wallet",
  "Martian Sui Wallet",
  "Morphis Wallet",
  "GlassWallet",
  "Ethos Wallet",
];

type Wallet = "Sui Wallet" | "Suiet" | "Nightly" | "Stashed";
const ConnectWallet = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const walletKit = useWalletKit();
  const wallet = useWallet();

  const wallets = useMemo(
    () =>
      [...wallet.configuredWallets, ...wallet.detectedWallets].filter(
        (wlt) => !DisabledWallets.includes(wlt.name),
      ),
    [wallet.configuredWallets, wallet.detectedWallets],
  );
  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm" variant="secondary">
        Connect Wallet
      </Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="flex flex-col items-center">
          <div className="text-xl" onClick={() => walletKit.select("Suiet")}>
            Connect Wallet
          </div>
          <div className="border-[rgba(255, 255, 255, 0.59)] mt-4 flex gap-2 rounded-2xl border p-[10px] pb-[5px]">
            {[wallets[1], wallets[0], wallets[2], wallets[3]]?.map(
              (item, index) => (
                <div
                  className="cursor-pointer"
                  onClick={async () => {
                    if (item.installed) {
                      try {
                        await walletKit.select(item.name);
                      } catch (error) {}
                    }
                  }}
                  key={index}
                >
                  <div
                    className={`relative w-[62px] ${item.name === "Suiet" ? "h-[55px]" : "h-[62px]"}`}
                  >
                    <Image
                      key={index}
                      src={WalletsIconMapper[item.name as Wallet]}
                      alt="wallet"
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ConnectWallet;
