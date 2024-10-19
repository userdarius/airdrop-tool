/* eslint-disable no-restricted-globals */
/* eslint-disable no-else-return */
/* eslint-disable prefer-template */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-nocheck
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { KioskClient, KioskTransaction, Network } from "@mysten/kiosk";
import { formatAddress as fa } from "@mysten/sui.js/utils";
import { useWallet } from "@suiet/wallet-kit";
import config from "@/config";

export const suiClient = new SuiClient({
  url: getFullnodeUrl(config.SUI_NETWORK),
});

export const kioskClient = new KioskClient({
  client: suiClient,
  network: config.SUI_NETWORK,
});

export const formatAddress = (address: string) => fa(address);
export const useWalletKit = useWallet;
