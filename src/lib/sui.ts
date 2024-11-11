/* eslint-disable no-restricted-globals */
/* eslint-disable no-else-return */
/* eslint-disable prefer-template */
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { KioskClient, Network } from "@mysten/kiosk";
import { formatAddress as fa } from "@mysten/sui.js/utils";
import { useWallet } from "@suiet/wallet-kit";


export const suiClient = new SuiClient({
  url: getFullnodeUrl("mainnet"),
});

export const kioskClient = new KioskClient({
  client: suiClient,
  network: Network.MAINNET,
});

export const formatAddress = (address: string) => fa(address);
export const useWalletKit = useWallet;
