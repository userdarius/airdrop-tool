/* eslint-disable react/react-in-jsx-scope */
import { useCallback, useEffect, useState } from "react";
import { useWalletKit, suiClient, kioskClient, formatAddress } from "@/lib/sui";
import { set, useForm } from "react-hook-form";
import { Transaction } from "@mysten/sui/transactions";
import { Button } from "@/components/ui/button";
import { KioskClient, KioskTransaction, Network } from "@mysten/kiosk";
import Head from "next/head";
import config from "@/config";
import {
  isValidSuiAddress,
  isValidSuiObjectId,
  normalizeStructTag,
  normalizeSuiObjectId,
} from "@mysten/sui.js/utils";
import { chunkArray, fetchAllDynamicFields } from "@polymedia/suitcase-core";
import invariant from "tiny-invariant";
import { pathOr } from "ramda";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { ShowModal } from "../mint";
import { useRouter } from "next/router";

export default function OwnedObjectsPage() {
  const walletKit = useWalletKit();
  const [ownedRootlets, setOwnedRootlets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const ROOTLET_TYPE =
    "0x8f74a7d632191e29956df3843404f22d27bd84d92cca1b1abde621d033098769::rootlet::Rootlet";

  const fetchOwnedKiosks = async () => {
    setIsLoading(true);
    const address =
      "0x43af2f949516a90482cfab1a5b5bb94f53c87f5592a0df8ddeb651fdc393a974";
    try {
      const { kioskIds } = await kioskClient.getOwnedKiosks({
        address: address || "",
        pagination: {
          limit: 50,
        },
      });

      // Fetch the kiosk with objects that have the ROOTLET_TYPE out of all owned kiosks
      for (const kioskId of kioskIds) {
        const kiosk = await kioskClient.getKiosk({
          id: kioskId.toString(),
          options: {
            withObjects: true,
          },
        });
        console.log("Kiosk:", kiosk);
        const objects = kiosk.items || [];
        console.log("Objects:", objects);
        for (const obj of objects) {
          if (obj.type === ROOTLET_TYPE) {
            console.log("Rootlet:", obj);
            setOwnedRootlets((prev) => {
              const alreadyExists = prev.some(
                (rootlet) => rootlet.data.objectId === obj.objectId,
              );
              if (!alreadyExists) {
                return [...prev, obj];
              }
              return prev;
            });
          }
        }
      }
      console.log("Owned Rootlets:", ownedRootlets);
    } catch (error) {
      console.error("Error fetching owned kiosks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Owned Rootlets</title>
      </Head>
      <h1 className="mb-4 text-2xl font-bold">Owned Rootlets</h1>
      <div className="mb-4 flex gap-4">
        {ownedRootlets.length == 0 && (
          <Button onClick={fetchOwnedKiosks} disabled={isLoading}>
            {isLoading ? "Loading..." : "Get Owned Rootlets"}
          </Button>
        )}
        {ownedRootlets.length > 0 && (
          <Button onClick={fetchOwnedKiosks} disabled={isLoading}>
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        )}
      </div>
      {ownedRootlets.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-xl font-semibold">Object List:</h2>
          <ul className="list-disc pl-5">
            {ownedRootlets.map((obj, index) => (
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
