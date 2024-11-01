/* eslint-disable react/react-in-jsx-scope */
import { useCallback, useEffect, useState } from "react";
import { useWalletKit, kioskClient, suiClient } from "@/lib/sui";
import { Button } from "@/components/ui/button";
import Head from "next/head";
import { useRouter } from "next/router";
import { KioskItem } from "@mysten/kiosk";
import { Transaction } from "@mysten/sui/transactions";
import { SuiObjectResponse } from "@mysten/sui/client";
import { Keypair } from "@mysten/sui/cryptography";

export default function OwnedObjectsPage() {
  const walletKit = useWalletKit();
  const [ownedRootlets, setOwnedRootlets] = useState<any[]>([]);
  const [rootletMetadata, setRootletMetadata] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [ownedObjects, setOwnedObjects] = useState<any[]>([]);
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

  const receiveTokens = async (rootletId: string, objToReceive: any) => {
    try {
      console.log("Receiving object:", objToReceive);
      console.log("Rootlet ID:", rootletId);
      tx.moveCall({
        target:
          "0x8f74a7d632191e29956df3843404f22d27bd84d92cca1b1abde621d033098769::rootlet::receive_obj",
        arguments: [tx.object(rootletId), tx.object(objToReceive)],
      });

      await walletKit.signAndExecuteTransaction({ transaction: tx });
    } catch (error) {
      console.error("Error receiving object:", error);
    }
  };

  const getOwnedObjectsFromNFT = async (obj: any) => {
    console.log("Fetching owned objects for NFT:", obj.data.objectId);
    const response = await suiClient.getOwnedObjects({
      owner: obj.data.objectId,
      options: {
        showContent: true,
        showType: true,
        showBcs: true,
      },
    });
    console.log("Owned objects for NFT:", response);
    setOwnedObjects(response.data);

    // Set an empty message if no objects are owned
    if (response.data.length === 0) {
      setOwnedObjects([{ objectId: "Nothing found." }]);
    }
  };

  // const receiveAll = async () => {};

  const getMetadata = async (nfts: KioskItem[]) => {
    const metadataList: SuiObjectResponse[] = [];

    for (const nft of nfts) {
      const metadata = await suiClient.getObject({
        id: nft.objectId,
        options: {
          showContent: true,
          showType: true,
          showBcs: true,
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
    const address = walletKit.address; // change this to walletKit.address in prod
    console.log("Fetching owned Rootlets for address:", address);
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

  const openModal = async (obj: any) => {
    console.log("Opening modal for object:", obj);
    setSelectedObject(obj);
    setModalVisible(true);
    // Fetch owned objects associated with this NFT when modal opens
    await getOwnedObjectsFromNFT(obj);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedObject(null);
    setOwnedObjects([]); // Reset owned objects when modal closes
  };

  useEffect(() => {
    if (ownedRootlets.length > 0) {
      console.log("Owned Rootlets updated:", ownedRootlets);
    }
  }, [ownedRootlets]);

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Rootlets airdrop tool</title>
      </Head>
      <h1 className="mb-4 text-2xl font-bold">
        Claim airdrops sent to your Rootlets
      </h1>
      <div className="mb-4 flex gap-4">
        {rootletMetadata.length === 0 && (
          <Button onClick={fetchOwnedRootlets} disabled={isLoading}>
            {isLoading ? "Loading..." : "Show my Rootlets"}
          </Button>
        )}
        {rootletMetadata.length > 0 && (
          <Button onClick={fetchOwnedRootlets} disabled={isLoading}>
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        )}
      </div>

      {rootletMetadata.length > 0 ? (
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
                <div className="truncate text-center">
                  <strong>Object {index + 1}:</strong> {obj.data.objectId}
                  <br />
                  <span className="truncate text-sm text-gray-400">
                    Digest: {obj.data.digest}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 text-center text-gray-400">No rootlets found.</div>
      )}

      {modalVisible && selectedObject && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[80vh] w-1/2 overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-5 flex justify-center">
              <img
                src={selectedObject.data.content.fields.image_url}
                alt="Rootlet"
                className="h-30 w-30 rounded-md"
              />
            </div>

            <h2 className="mb-4 text-xl font-bold text-black">NFT Details</h2>

            <p>
              <strong className="text-black">
                This NFT owns the following:
              </strong>
              <span className="block w-full truncate text-black">
                {ownedObjects.length > 0
                  ? ownedObjects.map((obj) => obj.objectId).join(", ")
                  : "Nothing found."}
              </span>
            </p>

            <p>
              <strong className="text-black">Object ID:</strong>
              <span className="block w-full truncate text-black">
                {selectedObject.data.objectId}
              </span>
            </p>
            <p>
              <strong className="text-black">Digest:</strong>
              <span className="block w-full truncate text-black">
                {selectedObject.data.digest}
              </span>
            </p>

            <h3 className="mb-2 mt-4 text-lg font-semibold text-black">
              Metadata
            </h3>
            <table className="w-full border-collapse border border-black text-left text-black">
              <thead>
                <tr>
                  <th className="border border-black p-2">Attribute</th>
                  <th className="border border-black p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {selectedObject.data.content.fields.attributes.fields.contents.map(
                  (
                    attribute: { fields: { key: string; value: string } },
                    idx: number,
                  ) => (
                    <tr key={idx}>
                      <td className="border border-black p-2">
                        {attribute.fields.key}
                      </td>
                      <td className="border border-black p-2">
                        {attribute.fields.value}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>

            <div className="mt-4 flex justify-center">
              <div className="mr-4 mt-4">
                <Button
                  onClick={() =>
                    receiveTokens(
                      selectedObject.data.objectId,
                      selectedObject.data,
                    )
                  }
                >
                  Claim airdrops
                </Button>
              </div>
              <div className="mt-4">
                <Button onClick={closeModal}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
