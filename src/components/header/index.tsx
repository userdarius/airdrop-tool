import { RootletsLogo } from "@/components/icons/rootlets-logo";
import Link from "next/link";
import ResponsiveMenu from "./responsive-menu";
import { NAVS } from "@/utilities/list";
import ConnectWallet from "@/components/connect-wallet";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { formatAddress, useWalletKit } from "@/lib/sui";
import { useState } from "react";
import RegisterModal from "../register-modal";
import config from "@/config";

const Header = () => {
  const router = useRouter();
  const walletKit = useWalletKit();
  const [isRegisterModalOpen, setIsRegisterModalOpen] =
    useState<boolean>(false);
  useEffect(() => {
    const { scrollTo } = router.query;
    if (scrollTo) {
      const element = document.getElementById(scrollTo as string);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        router.replace(router.pathname, undefined, { shallow: true });
      }
    }
  }, [router.query]); //eslint-disable-line
  return (
    <header className="flex justify-center border-b border-b-border/50 py-6">
      <div className="flex w-full max-w-[1400px] place-items-center px-[16px] md:px-[34px]">
        <div className="block lg:hidden">
          <ResponsiveMenu />
        </div>
        <div className="hidden w-full place-items-center lg:flex">
          <Link href="/">
            <RootletsLogo className="mr-8 xl:mr-32" />
          </Link>
          <nav className="flex gap-x-[20px] xl:gap-x-[52px]">
            {NAVS.map((nav) => (
              <Link key={nav.href} href={nav.href} className="text-sm">
                {nav.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="ml-auto flex h-full items-center">
          {config.HIDE_MINT !== "true" ? (
            <>
              <Button asChild size="sm">
                <Link
                  href="https://www.tradeport.xyz/sui/collection/rootlets"
                  target="_blank"
                >
                  Buy Now
                </Link>
              </Button>
              <div className="divider mx-4 h-5/6 w-[1px] bg-white/50"></div>
            </>
          ) : null}
          {!walletKit.connected ? (
            <ConnectWallet />
          ) : (
            <div className="whitespace-nowrap">
              <div>{formatAddress(walletKit?.address || "")}</div>
              <div
                className="cursor-pointer"
                onClick={() => walletKit.disconnect()}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </header>
  );
};

export default Header;
