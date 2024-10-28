/* eslint-disable react/react-in-jsx-scope */
import { useCallback, useEffect, useState } from "react";
import { useWalletKit, kioskClient, suiClient } from "@/lib/sui";
import { Button } from "@/components/ui/button";
import Head from "next/head";
import { useRouter } from "next/router";
import { KioskItem } from "@mysten/kiosk";
import { Transaction } from "@mysten/sui/transactions";
import { SuiObjectResponse } from "@mysten/sui/client";

export default function OwnedObjectsPage() {
  const walletKit = useWalletKit();
  const [ownedRootlets, setOwnedRootlets] = useState<any[]>([]);
  const [rootletMetadata, setRootletMetadata] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const router = useRouter();
  const tx = new Transaction(); // construct transaction

  const ROOTLET_TYPE =
    "0x8f74a7d632191e29956df3843404f22d27bd84d92cca1b1abde621d033098769::rootlet::Rootlet";

  // Move function to call
  /*public fun receive_obj<T: key + store>(
      rootlet: &mut Rootlet,
      obj_to_receive: Receiving<T>,
  ): T {
      transfer::public_receive(rootlet.uid_mut(), obj_to_receive)
  }*/

  // const receiveTokens = async (rootletId: string, objToReceive: any) => {
  //   tx.moveCall({ package: "0x8f74a7d632191e29956df3843404f22d27bd84d92cca1b1abde621d033098769", module: "rootlet", function: "receive_obj", arguments: [rootletId, objToReceive] });

  // }

  const receiveAll = async () => {};

  const getMetadata = async (nfts: KioskItem[]) => {
    const metadataList: SuiObjectResponse[] = [];

    for (const nft of nfts) {
      const metadata = await suiClient.getObject({
        id: nft.objectId,
        options: {
          showContent: true,
        },
      });

      metadataList.push(metadata);
    }

    setRootletMetadata((prev) => [...prev, ...metadataList]);
  };

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
            const alreadyExists = ownedRootlets.some(
              (rootlet) => rootlet.data.objectId === obj.objectId,
            );
            if (!alreadyExists) {
              newRootlets.push(obj);
            }
          }
        }
      }

      setOwnedRootlets((prev) => [...prev, ...newRootlets]);
      getMetadata(newRootlets);
    } catch (error) {
      console.error("Error fetching owned Rootlets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (obj: any) => {
    setSelectedObject(obj);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedObject(null);
  };

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
        {rootletMetadata.length === 0 && (
          <Button onClick={fetchOwnedRootlets} disabled={isLoading}>
            {isLoading ? "Loading..." : "Get Owned Rootlets"}
          </Button>
        )}
        {rootletMetadata.length > 0 && (
          <Button onClick={fetchOwnedRootlets} disabled={isLoading}>
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        )}
      </div>
      {rootletMetadata.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-xl font-semibold">Your Rootlets:</h2>
        
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {rootletMetadata.map((obj, index) => (
              <div
                key={obj.data.objectId}
                className="transform cursor-pointer rounded-lg border border-gray-600 bg-gray-800 p-4 shadow-lg transition duration-200 hover:scale-105"
                onClick={() => openModal(obj)}
              >
                <img
                  src={obj.data.content.fields.image_url}
                  alt="Rootlet"
                  className="mb-2 h-48 w-full rounded-lg object-cover"
                />
                <div className="text-center truncate">
                  <strong>Object {index + 1}:</strong> {obj.data.objectId}
                  <br />
                  <span className="text-sm text-gray-400 truncate">
                    Digest: {obj.data.digest}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalVisible && selectedObject && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-1/2 rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-5 flex justify-center">
              <img
                src={selectedObject.data.content.fields.image_url}
                alt="Rootlet"
                className="h-30 w-30 rounded-md"
              />
            </div>

            <h2 className="mb-4 text-xl font-bold text-black">
              Object Details
            </h2>
            <p>
              <strong className="text-black">Object ID:</strong>
              <span className="block w-full truncate text-black">
                {" "}
                {selectedObject.data.objectId}
              </span>
            </p>
            <p>
              <strong className="text-black">Digest:</strong>
              <span className="text-black"> {selectedObject.data.digest}</span>
            </p>
            <div className="mt-4">
              <Button onClick={closeModal}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
