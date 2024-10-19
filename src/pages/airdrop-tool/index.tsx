/* eslint-disable react/react-in-jsx-scope */
import { useCallback, useEffect, useState } from "react";
import { useWalletKit, kioskClient, suiClient } from "@/lib/sui";
import { Button } from "@/components/ui/button";
import Head from "next/head";
import { useRouter } from "next/router";
import { KioskItem } from "@mysten/kiosk";
import { SuiObjectResponse } from "@mysten/sui/client";

export default function OwnedObjectsPage() {
  const walletKit = useWalletKit();
  const [ownedRootlets, setOwnedRootlets] = useState<any[]>([]);
  const [rootletMetadata, setRootletMetadata] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const ROOTLET_TYPE =
    "0x8f74a7d632191e29956df3843404f22d27bd84d92cca1b1abde621d033098769::rootlet::Rootlet";

  const getMetadata = async (nfts) => {
    const metadataList: SuiObjectResponse[] = []; // Temporary array to store metadata

    for (const nft of nfts) {
      const metadata = await suiClient.getObject({
        id: nft.objectId,
        options: {
          showContent: true,
        },
      });

      // Add each metadata result to the temporary array
      metadataList.push(metadata);
    }

    // Update state once after all metadata is fetched
    setRootletMetadata((prev) => [...prev, ...metadataList]);
  };

  // Track changes to rootletMetadata and log it
  useEffect(() => {
    if (rootletMetadata.length > 0) {
      console.log("Rootlet Metadata updated:", rootletMetadata);
    }
  }, [rootletMetadata]);

  const fetchOwnedRootlets = async () => {
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

      const newRootlets: KioskItem[] = [];

      // Fetch the kiosk with objects that have the ROOTLET_TYPE out of all owned kiosks
      for (const kioskId of kioskIds) {
        const kiosk = await kioskClient.getKiosk({
          id: kioskId.toString(),
          options: {
            withObjects: true,
          },
        });
        const objects = kiosk.items || [];
        for (const obj of objects) {
          if (obj.type === ROOTLET_TYPE) {
            // Only add new unique objects
            const alreadyExists = ownedRootlets.some(
              (rootlet) => rootlet.data.objectId === obj.objectId,
            );
            if (!alreadyExists) {
              newRootlets.push(obj);
            }
          }
        }
      }

      // Update state after all rootlets are fetched
      setOwnedRootlets((prev) => [...prev, ...newRootlets]);
      getMetadata(newRootlets);
    } catch (error) {
      console.error("Error fetching owned Rootlets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Track changes to ownedRootlets
  useEffect(() => {
    if (ownedRootlets.length > 0) {
      console.log("Owned Rootlets updated:", ownedRootlets);
    }
  }, [ownedRootlets]);

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Owned Rootlets</title>
      </Head>
      <h1 className="mb-4 text-2xl font-bold">Owned Rootlets</h1>
      <div className="mb-4 flex gap-4">
        {ownedRootlets.length == 0 && (
          <Button onClick={fetchOwnedRootlets} disabled={isLoading}>
            {isLoading ? "Loading..." : "Get Owned Rootlets"}
          </Button>
        )}
        {ownedRootlets.length > 0 && (
          <Button onClick={fetchOwnedRootlets} disabled={isLoading}>
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
