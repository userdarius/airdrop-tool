/* eslint-disable react/react-in-jsx-scope */
import { useEffect, useState } from "react";
import { useWalletKit, kioskClient, suiClient } from "@/lib/sui";
import { Button } from "@/components/ui/button";
import Head from "next/head";
import { KioskItem } from "@mysten/kiosk";
import {
  Transaction,
  TransactionObjectArgument,
  TransactionResult,
} from "@mysten/sui/transactions";
import { SuiObjectResponse } from "@mysten/sui/client";
import { bcs } from "@mysten/sui/bcs";

export default function OwnedObjectsPage() {
  const walletKit = useWalletKit();
  const [ownedRootlets, setOwnedRootlets] = useState<any[]>([]);
  const [rootletMetadata, setRootletMetadata] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [ownedObjects, setOwnedObjects] = useState<any[]>([]);
  const tx = new Transaction(); // construct transaction

  type NFT = {
    id: string;
    owner: {
      kiosk_id: string;
      personal_kiosk_cap_id: string;
    };
  };

  const ROOTLET_TYPE =
    "0x8f74a7d632191e29956df3843404f22d27bd84d92cca1b1abde621d033098769::rootlet::Rootlet";

  // Helper functions for fetching kiosk information

  /**
   * Fetches the Kiosk Owner Caps owned by the current wallet address.
   * @returns {Promise<KioskOwnerCap[]>} The owned Kiosk Owner Caps.
   */
  const fetchKioskOwnerCaps = async () => {
    const address = walletKit.address;
    console.log("Fetching owned Kiosk Owner Caps for address:", address);
    try {
      const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({
        address: address || "",
        pagination: {
          limit: 50,
        },
      });

      return kioskOwnerCaps;
    } catch (error) {
      console.error("Error fetching owned Kiosk Owner Caps:", error);
    }
  };

  /**
   * Fetches the Kiosk IDs owned by the current wallet address.
   * @returns {Promise<string[]>} The owned Kiosk IDs.
   */
  const fetchKioskIds = async () => {
    const address = walletKit.address;
    console.log("Fetching owned Kiosks for address:", address);
    try {
      const { kioskIds } = await kioskClient.getOwnedKiosks({
        address: address || "",
        pagination: {
          limit: 50,
        },
      });

      return kioskIds;
    } catch (error) {
      console.error("Error fetching owned Kiosks:", error);
    }
  };

  /**
   * Fetches the objectIds of kioskOwnerCaps with associated rootlets.
   * @returns {Promise<string[]>} The objectIds of kioskOwnerCaps with associated rootlets.
   */
  const fetchKioskOwnerCapObjectIdsWithRootlets = async () => {
    try {
      const kioskOwnerCaps = await fetchKioskOwnerCaps();
      const kioskOwnerCapObjectIdsWithRootlets = [];

      for (const kioskOwnerCap of kioskOwnerCaps || []) {
        const kiosk = await kioskClient.getKiosk({
          id: kioskOwnerCap.kioskId.toString(),
          options: {
            withObjects: true,
          },
        });

        const hasRootlet = kiosk.items?.some(
          (item) => item.type === ROOTLET_TYPE,
        );

        if (hasRootlet) {
          kioskOwnerCapObjectIdsWithRootlets.push(kioskOwnerCap.objectId);
        }
      }
      return kioskOwnerCapObjectIdsWithRootlets;
    } catch (error) {
      console.error(
        "Error fetching KioskOwnerCap objectIds with rootlets:",
        error,
      );
      return [];
    }
  };

  /**
   * Borrow a Rootlet from a Kiosk.
   * @param nft The NFT object to borrow.
   * @param tx The transaction object.
   * @returns {TransactionObjectArgument[]} The result of the transactions.
   */
  function borrowRootletFromKiosk(nft: NFT, tx: Transaction) {
    const personal_kiosk_package_id = kioskClient.getRulePackageId(
      "personalKioskRulePackageId",
    );

    const [kioskOwnerCap, returnKioskOwnerCapPromise] = tx.moveCall({
      target: `${personal_kiosk_package_id}::personal_kiosk::borrow_val`,
      arguments: [tx.object(nft.owner.personal_kiosk_cap_id)],
    });

    const [borrowedNft, returnNftPromise] = tx.moveCall({
      target: "0x2::kiosk::borrow_val",
      arguments: [
        tx.object(nft.owner.kiosk_id),
        kioskOwnerCap,
        tx.pure.address(nft.id),
      ],
      typeArguments: [ROOTLET_TYPE],
    });

    return [
      kioskOwnerCap,
      returnKioskOwnerCapPromise,
      borrowedNft,
      returnNftPromise,
    ];
  }

  function returnRootletToKiosk(
    nft: NFT,
    kioskOwnerCap: TransactionObjectArgument,
    returnKioskOwnerCapPromise: TransactionObjectArgument | null,
    borrowedNft: TransactionObjectArgument,
    returnNftPromise: TransactionObjectArgument,
    tx: Transaction,
  ) {
    const personal_kiosk_package_id = kioskClient.getRulePackageId(
      "personalKioskRulePackageId",
    );
    tx.moveCall({
      target: "0x2::kiosk::return_val",
      arguments: [tx.object(nft.owner.kiosk_id), borrowedNft, returnNftPromise], // still need to create the nft object
      typeArguments: [ROOTLET_TYPE],
    });

    if (nft.owner.personal_kiosk_cap_id) {
      tx.moveCall({
        target: `${personal_kiosk_package_id}::personal_kiosk::borrow_val`,
        arguments: [
          tx.object(nft.owner.personal_kiosk_cap_id as string),
          kioskOwnerCap,
          returnKioskOwnerCapPromise as TransactionObjectArgument,
        ],
      });
    }
  }

  // Move function to call
  /*public fun receive_obj<T: key + store>(
      rootlet: &mut Rootlet,
      obj_to_receive: Receiving<T>,
  ): T {
      transfer::public_receive(rootlet.uid_mut(), obj_to_receive)
  }*/

  // TODO: Need to match the rootletId to the object ID of the rootlet stored in ownedRootlets
  const receiveTokens = async (rootletId: string, objToReceive: any) => {
    // create NFT object and borrow from kiosk
    for (const rootlet of ownedRootlets) {
      if (rootlet.data.objectId !== rootletId) {
        continue;
      }
      const kioskcapids = await fetchKioskOwnerCapObjectIdsWithRootlets();

      for (const kioskcapid of kioskcapids) {
        const nft: NFT = {
          id: rootletId,
          owner: {
            kiosk_id: rootlet.kioskId,
            personal_kiosk_cap_id: kioskcapid,
          },
        };
        console.log("NFT:", nft);
        const [
          kioskOwnerCap,
          returnKioskOwnerCapPromise,
          borrowedNft,
          returnNftPromise,
        ] = borrowRootletFromKiosk(nft, tx);

        returnRootletToKiosk(
          nft,
          kioskOwnerCap,
          returnKioskOwnerCapPromise,
          borrowedNft,
          returnNftPromise,
          tx,
        );
      }
      try {
        // console.log("Receiving object:", objToReceive);
        // console.log("Rootlet ID:", rootletId);
        // tx.moveCall({
        //   target:
        //     "0x3d8d36f1207c5cccfd9e3b25fa830231da282a03b2874b3737096833aa72edd2::rootlet::receive_obj",
        //   arguments: [tx.object(rootletId), tx.object(objToReceive)],
        // });
        console.log("Final transaction data:", tx.getData());


        //await suiClient.signAndExecuteTransaction({ transaction: tx });
        await walletKit.signAndExecuteTransaction({ transaction: tx });
      } catch (error) {
        console.error("Error receiving object:", error);
      }
    }
  };

  const getOwnedObjectsFromNFT = async (obj: any) => {
    try {
      const response = await suiClient.getOwnedObjects({
        owner: obj.data.objectId,
        options: {
          showContent: true,
          showType: true,
          showBcs: true,
        },
      });

      setOwnedObjects(response.data);

      // Set an empty message if no objects are owned
      if (response.data.length === 0) {
        setOwnedObjects([{ objectId: "Nothing found." }]);
      }
    } catch (error) {
      console.error("Error fetching owned objects for NFT:", error);
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

  /**
   * Fetches the Rootlets owned by the current wallet address and updates the state with the new Rootlets.
   * @returns {Promise<void>}
   */
  const fetchOwnedRootlets = async () => {
    setIsLoading(true);
    try {
      const kioskIds = await fetchKioskIds();
      const newRootlets: KioskItem[] = [];

      for (const kioskId of kioskIds || []) {
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
          <div className="max-h-[80vh] w-1/2 overflow-y-auto rounded-lg bg-gray-800 p-6 shadow-lg">
            <div className="mb-5 flex justify-center">
              <img
                src={selectedObject.data.content.fields.image_url}
                alt="Rootlet"
                className="h-30 w-30 rounded-md"
              />
            </div>

            <h2 className="mb-4 text-xl font-bold text-white">NFT Details</h2>

            <p>
              <strong className="text-white">
                This NFT owns the following:
              </strong>
              <span className="block w-full truncate text-white">
                {
                  /*ownedObjects.length > 0
            ? ownedObjects.map((obj) => obj.data.type).join(", ")
            :*/ "Nothing found."
                }
              </span>
            </p>

            <p>
              <strong className="text-white">Object ID:</strong>
              <span className="block w-full truncate text-white">
                {selectedObject.data.objectId}
              </span>
            </p>
            <p>
              <strong className="text-white">Digest:</strong>
              <span className="block w-full truncate text-white">
                {selectedObject.data.digest}
              </span>
            </p>

            <h3 className="mb-2 mt-4 text-lg font-semibold text-white">
              Metadata
            </h3>
            <table className="w-full border-collapse border border-white text-left text-white">
              <thead>
                <tr>
                  <th className="border border-white p-2">Attribute</th>
                  <th className="border border-white p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {selectedObject.data.content.fields.attributes.fields.contents.map(
                  (
                    attribute: { fields: { key: string; value: string } },
                    idx: number,
                  ) => (
                    <tr key={idx}>
                      <td className="border border-white p-2">
                        {attribute.fields.key}
                      </td>
                      <td className="border border-white p-2">
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
                      ownedObjects[0].objectId,
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
