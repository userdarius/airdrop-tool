/* eslint-disable @next/next/no-img-element */
// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { useWalletKit, suiClient, kioskClient, formatAddress } from "@/lib/sui";
import { set, useForm } from "react-hook-form";
import { Transaction } from "@mysten/sui/transactions";
import { Button } from "@/components/ui/button";
import { KioskClient, KioskTransaction, Network } from "@mysten/kiosk";
import Head from "next/head";
import config from "@/config";
import { normalizeStructTag, normalizeSuiObjectId } from "@mysten/sui.js/utils";
import { chunkArray, fetchAllDynamicFields } from "@polymedia/suitcase-core";
import invariant from "tiny-invariant";
import { pathOr } from "ramda";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { ShowModal } from "../mint";
import { useRouter } from "next/router";

export default function OwnedObjectsPage() {
  const walletKit = useWalletKit();
  const [ownedKiosks, setOwnedKiosks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const fetchOwnedKiosks = async () => {
    setIsLoading(true);
    const address = walletKit.address;
    try {
      const { kioskOwnerCaps, kioskIds } = await kioskClient.getOwnedKiosks({
        address,
      });
      console.log("Kiosk owner caps:", kioskOwnerCaps);
      console.log("Owned Kiosks:", kioskIds);
      
      // kioskid is invalid for some reason
      const res = await kioskClient.getKiosk({
        kioskId: kioskIds[0],
        options: {
          withKioskFields: true, 
          withObjects: true, 
        },
      });
      console.log(res);
    } catch (error) {
      console.error("Error fetching owned kiosks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to the NFT details page
  const handleNFTClick = (objectId: string) => {
    router.push(`/nft/index?objectId=${objectId}`);
  };

  // Filter function to get NFTs from a specific collection
  const filterNFTCollection = (objects: any[]) => {
    return objects.filter((obj) => obj.data.type === NFT_COLLECTION_TYPE);
  };

  const filterRootlets = (objects: any[]) => {
    setRootletObjects(
      objects.filter(
        (obj) =>
          obj.data.objectId ===
          "0x12ed687eeba7b273e45965d7bbebf2a0f7f86917ac3c904f596a3f01033d9551",
      ),
    );
    return objects.filter(
      (obj) =>
        obj.data.objectId ===
        "0x12ed687eeba7b273e45965d7bbebf2a0f7f86917ac3c904f596a3f01033d9551",
    );
  };

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Owned Objects</title>
      </Head>
      <h1 className="mb-4 text-2xl font-bold">Owned Objects</h1>
      <div className="mb-4 flex gap-4">
        {ownedKiosks.length == 0 && (
          <Button onClick={fetchOwnedKiosks} disabled={isLoading}>
            {isLoading ? "Loading..." : "Get Owned Objects"}
          </Button>
        )}
        {ownedKiosks.length > 0 && (
          <Button onClick={fetchOwnedKiosks} disabled={isLoading}>
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        )}
      </div>
      {ownedKiosks.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-xl font-semibold">Object List:</h2>
          <ul className="list-disc pl-5">
            {ownedKiosks.map((obj, index) => (
              <li key={obj.data.objectId} className="mb-2">
                <strong>Object {index + 1}:</strong> {obj.data.objectId}
                <br />
                <span className="text-sm text-gray-600">
                  Digest: {obj.data.digest}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
