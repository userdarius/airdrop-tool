/* eslint-disable react/react-in-jsx-scope */
import { useEffect, useState } from "react";
import { useWalletKit, kioskClient, suiClient } from "@/lib/sui";
import { Button } from "@/components/ui/button";
import Head from "next/head";
import { KioskItem, KioskOwnerCap } from "@mysten/kiosk";
import { Transaction } from "@mysten/sui/transactions";
import { SuiObjectResponse } from "@mysten/sui/client";
import { Progress } from "@/components/ui/progress";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

export default function OwnedObjectsPage() {
  const walletKit = useWalletKit();
  const [ownedRootlets, setOwnedRootlets] = useState<any[]>([]);
  const [rootletMetadata, setRootletMetadata] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [ownedObjects, setOwnedObjects] = useState<any[]>([]);
  const [nftCount, setNftCount] = useState(0);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const [totalAirdrops, setTotalAirdrops] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMessages = [
    "Loading your Rootlets...",
    "Wow you have a lot of NFTs! Give us a sec to fetch them all.",
  ];
  const tx = new Transaction();

  type NFT = {
    id: string;
    owner: {
      kiosk_id: string;
      personal_kiosk_cap_id: string;
    };
  };

  // Constants to be moved to configuration file
  const ROOTLET_TYPE =
    "0x8f74a7d632191e29956df3843404f22d27bd84d92cca1b1abde621d033098769::rootlet::Rootlet";

  const RECEIVE_ROOTLET_METHOD =
    "0xbe7741c72669f1552d0912a4bc5cdadb5856bcb970350613df9b4362e4855dc5::rootlet::receive_obj";

  /**
   * Processes an array of items in batches with rate limiting
   * @param items Items to process
   * @param batchSize Number of items to process in each batch
   * @param delayMs Delay between batches in milliseconds
   * @param processFn Function to process each item
   * @param onProgress Optional callback for progress updates
   */
  async function processInBatches<T, R>(
    items: T[],
    batchSize: number,
    delayMs: number,
    processFn: (item: T) => Promise<R>,
    onProgress?: (progress: number) => void,
  ): Promise<R[]> {
    const results: R[] = [];
    const batches = Math.ceil(items.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, items.length);
      const batch = items.slice(start, end);

      // Process items in current batch concurrently
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          try {
            return await processFn(item);
          } catch (error) {
            console.error(`Error processing item:`, error);
            throw error;
          }
        }),
      );

      results.push(...batchResults);

      // Update progress
      const progress = (((i + 1) * batchSize) / items.length) * 100;
      onProgress?.(Math.min(progress, 100));

      // Add delay between batches, except for the last batch
      if (i < batches - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  /**
   * Fetches the Kiosk IDs owned by the current wallet address.
   * @returns {Promise<string[]>} The owned Kiosk IDs.
   */
  const fetchKioskIds = async () => {
    const address = walletKit.address;
    // const address =
    //   "0x3d8d36f1207c5cccfd9e3b25fa830231da282a03b2874b3737096833aa72edd2";
    try {
      let allKioskIds: string[] = [];
      let hasNextPage = true;
      let cursor: string | null = null;

      while (hasNextPage) {
        const response = await kioskClient.getOwnedKiosks({
          address: address || "",
          pagination: {
            limit: 50,
            cursor: cursor ?? undefined,
          },
        });

        allKioskIds = [...allKioskIds, ...response.kioskIds];

        if (response.hasNextPage && response.nextCursor) {
          cursor = response.nextCursor;
        } else {
          hasNextPage = false;
        }
      }

      return allKioskIds;
    } catch (error) {
      console.error("Error fetching owned Kiosks:", error);
    }
  };

  /**
   * Claim tokens airdropped to one rootlet in particular
   * @param rootletId the object id of the rootlet
   * @param recipient the address receiving the tokens
   */
  const receiveTokens = async (rootletId: string, recipient: string) => {
    // Get all kiosks
    const address = walletKit.address;
    // const address =
    //   "0x3d8d36f1207c5cccfd9e3b25fa830231da282a03b2874b3737096833aa72edd2";
    try {
      let allKioskOwnerCaps: KioskOwnerCap[] = [];
      let hasNextPage = true;
      let cursor: string | null = null;

      while (hasNextPage) {
        const response = await kioskClient.getOwnedKiosks({
          address: address || "",
          pagination: {
            limit: 50,
            cursor: cursor ?? undefined,
          },
        });

        allKioskOwnerCaps = [...allKioskOwnerCaps, ...response.kioskOwnerCaps];

        if (response.hasNextPage && response.nextCursor) {
          cursor = response.nextCursor;
        } else {
          hasNextPage = false;
        }
      }

      const { kioskOwnerCaps } = { kioskOwnerCaps: allKioskOwnerCaps };

      // keep only personal kiosks
      const personalKiosks = kioskOwnerCaps.filter(
        (kioskOwnerCap) => kioskOwnerCap.isPersonal === true,
      );

      // get all items in the kiosks
      const kioskItems = [];
      for (const kioskOwnerCap of personalKiosks) {
        const kiosk = await kioskClient.getKiosk({
          id: kioskOwnerCap.kioskId.toString(),
          options: {
            withObjects: true,
          },
        });
        kioskItems.push({
          items: kiosk.items,
          kioskOwnerCap,
        });
      }

      // if it's a rootlet add cap id and kiosk id
      const nfts = [];
      for (const kioskData of kioskItems) {
        for (const obj of kioskData.items) {
          if (obj.type === ROOTLET_TYPE) {
            const nft: NFT = {
              id: obj.objectId,
              owner: {
                kiosk_id: obj.kioskId,
                personal_kiosk_cap_id: kioskData.kioskOwnerCap.objectId,
              },
            };
            nfts.push(nft);
          }
        }
      }

      // if it's the nft in question claim tokens from it
      for (const nft of nfts) {
        const thisNft = nft;
        if (thisNft.id == rootletId) {
          const personal_kiosk_package_id = kioskClient.getRulePackageId(
            "personalKioskRulePackageId",
          );

          const COINS = await suiClient.getOwnedObjects({
            owner: thisNft.id,
            options: {
              showContent: true,
              showType: true,
            },
          });

          for (const token of COINS.data) {
            const [kioskOwnerCap, perosnalBorrow] = tx.moveCall({
              target: `${personal_kiosk_package_id}::personal_kiosk::borrow_val`,
              arguments: [tx.object(thisNft.owner.personal_kiosk_cap_id)],
            });

            const [nft, nftBorrow] = tx.moveCall({
              target: `0x2::kiosk::borrow_val`,
              arguments: [
                tx.object(thisNft.owner.kiosk_id),
                kioskOwnerCap,
                tx.pure.id(thisNft.id),
              ],
              typeArguments: [ROOTLET_TYPE],
            });

            const coin = tx.moveCall({
              target: RECEIVE_ROOTLET_METHOD,
              arguments: [nft, tx.object(token.data?.objectId as string)],
              typeArguments: [token.data?.type as string],
            });

            tx.transferObjects([coin], tx.pure.address(recipient as string));

            tx.moveCall({
              target: `0x2::kiosk::return_val`,
              arguments: [tx.object(thisNft.owner.kiosk_id), nft, nftBorrow],
              typeArguments: [ROOTLET_TYPE],
            });

            tx.moveCall({
              target: `${personal_kiosk_package_id}::personal_kiosk::return_val`,
              arguments: [
                tx.object(thisNft.owner.personal_kiosk_cap_id),
                kioskOwnerCap,
                perosnalBorrow,
              ],
            });
          }
        }
      }

      tx.setGasBudget(10000000);
      await walletKit.signAndExecuteTransaction({ transaction: tx });
    } catch (error) {
      console.error("Error fetching owned Kiosks:", error);
    }
  };

  /**
   * Claim all tokens airdropped to your rootlets in one trx
   */
  const claimAllObjectsInSingleTransaction = async () => {
    // Get all kiosks
    const recipient = walletKit.address;
    try {
      let allKioskOwnerCaps: KioskOwnerCap[] = [];
      let hasNextPage = true;
      let cursor: string | null = null;

      while (hasNextPage) {
        const response = await kioskClient.getOwnedKiosks({
          address: recipient || "",
          pagination: {
            limit: 50,
            cursor: cursor ?? undefined,
          },
        });

        allKioskOwnerCaps = [...allKioskOwnerCaps, ...response.kioskOwnerCaps];

        if (response.hasNextPage && response.nextCursor) {
          cursor = response.nextCursor;
        } else {
          hasNextPage = false;
        }
      }

      const { kioskOwnerCaps } = { kioskOwnerCaps: allKioskOwnerCaps };

      // keep only personal kiosks
      const personalKiosks = kioskOwnerCaps.filter(
        (kioskOwnerCap) => kioskOwnerCap.isPersonal === true,
      );

      // get all items in the kiosks
      const kioskItems = [];
      for (const kioskOwnerCap of personalKiosks) {
        const kiosk = await kioskClient.getKiosk({
          id: kioskOwnerCap.kioskId.toString(),
          options: {
            withObjects: true,
          },
        });
        kioskItems.push({
          items: kiosk.items,
          kioskOwnerCap,
        });
      }

      // if it's a rootlet add cap id and kiosk id
      const nfts = [];
      for (const kioskData of kioskItems) {
        for (const obj of kioskData.items) {
          if (obj.type === ROOTLET_TYPE) {
            const nft: NFT = {
              id: obj.objectId,
              owner: {
                kiosk_id: obj.kioskId,
                personal_kiosk_cap_id: kioskData.kioskOwnerCap.objectId,
              },
            };
            nfts.push(nft);
          }
        }
      }

      // claim all tokens from each rootlet
      for (const nft of nfts) {
        const thisNft = nft;

        const personal_kiosk_package_id = kioskClient.getRulePackageId(
          "personalKioskRulePackageId",
        );

        const COINS = await suiClient.getOwnedObjects({
          owner: thisNft.id,
          options: {
            showContent: true,
            showType: true,
          },
        });

        for (const token of COINS.data) {
          const [kioskOwnerCap, perosnalBorrow] = tx.moveCall({
            target: `${personal_kiosk_package_id}::personal_kiosk::borrow_val`,
            arguments: [tx.object(thisNft.owner.personal_kiosk_cap_id)],
          });

          const [nft, nftBorrow] = tx.moveCall({
            target: `0x2::kiosk::borrow_val`,
            arguments: [
              tx.object(thisNft.owner.kiosk_id),
              kioskOwnerCap,
              tx.pure.id(thisNft.id),
            ],
            typeArguments: [ROOTLET_TYPE],
          });

          const coin = tx.moveCall({
            target: RECEIVE_ROOTLET_METHOD,
            arguments: [nft, tx.object(token.data?.objectId as string)],
            typeArguments: [token.data?.type as string],
          });

          tx.transferObjects([coin], tx.pure.address(recipient as string));

          tx.moveCall({
            target: `0x2::kiosk::return_val`,
            arguments: [tx.object(thisNft.owner.kiosk_id), nft, nftBorrow],
            typeArguments: [ROOTLET_TYPE],
          });

          tx.moveCall({
            target: `${personal_kiosk_package_id}::personal_kiosk::return_val`,
            arguments: [
              tx.object(thisNft.owner.personal_kiosk_cap_id),
              kioskOwnerCap,
              perosnalBorrow,
            ],
          });
        }
      }

      tx.setGasBudget(10000000);
      await walletKit.signAndExecuteTransaction({ transaction: tx });
    } catch (error) {
      console.error(
        "Error claiming all objects in a single transaction:",
        error,
      );
    }
  };

  /**
   * Fetches the owned objects associated with an NFT.
   * @param obj The NFT object.
   */
  const getOwnedObjectsFromNFT = async (obj: SuiObjectResponse) => {
    try {
      if (!obj.data) {
        throw new Error("Object data is null or undefined");
      }

      const response = await suiClient.getOwnedObjects({
        owner: obj.data.objectId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      setOwnedObjects(response.data);

      // If no objects are owned, set an empty array
      if (response.data.length === 0) {
        setOwnedObjects([]);
      }

      return response.data.length; // Return the number of airdrops for this NFT
    } catch (error) {
      console.error("Error fetching owned objects for NFT:", error);
      return 0;
    }
  };

  /**
   * Fetches the metadata for the Rootlets to display in the UI.
   * @param nfts The Rootlets to fetch metadata for.
   * @returns {Promise<void>}
   */
  const getMetadata = async (nfts: KioskItem[]) => {
    setLoadingMetadata(true);
    setTotalNFTs(nfts.length);
    setProgress(0);
    let totalDrops = 0;

    try {
      const metadataList = await processInBatches(
        nfts,
        5, // Process 5 NFTs at a time
        500, // Wait 1 second between batches
        async (nft) => {
          const metadata = await suiClient.getObject({
            id: nft.objectId,
            options: {
              showContent: true,
              showType: true,
              showBcs: true,
            },
          });

          // Count airdrops for this NFT
          const airdropCount = await getOwnedObjectsFromNFT(metadata);
          totalDrops += airdropCount;

          return metadata;
        },
        (progress) => setProgress(progress),
      );

      setTotalAirdrops(totalDrops);
      setRootletMetadata((prev) => [...prev, ...metadataList]);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      // Handle error appropriately
    } finally {
      setLoadingMetadata(false);
    }
  };

  useEffect(() => {
    if (rootletMetadata.length > 0) {
      console.log("Rootlet Metadata updated:", rootletMetadata);
    }
  }, [rootletMetadata]);

  useEffect(() => {
    if (rootletMetadata.length > 0) {
      setNftCount(rootletMetadata.length);
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

  const openModal = async (obj: SuiObjectResponse) => {
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

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (loadingMetadata) {
      // Wait 5 seconds before starting the message alternation
      timeout = setTimeout(() => {
        const interval = setInterval(() => {
          setLoadingMessageIndex(
            (prevIndex) => (prevIndex + 1) % loadingMessages.length,
          );
        }, 5000);

        // Cleanup interval when loading finishes
        return () => clearInterval(interval);
      }, 5000);
    }

    // Cleanup timeout if loading stops before 5 seconds
    return () => clearTimeout(timeout);
  }, [loadingMetadata]);

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Rootlets airdrop tool</title>
      </Head>
      <ToastContainer />
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
        {nftCount > 1 && (
          <Button
            onClick={claimAllObjectsInSingleTransaction}
            disabled={totalAirdrops === 0}
            className={
              totalAirdrops === 0 ? "cursor-not-allowed opacity-50" : ""
            }
          >
            {totalAirdrops === 0 ? "Nothing to claim" : "Claim All"}
          </Button>
        )}
      </div>

      {/* Loading Progress Bar */}
      {loadingMetadata && (
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm">
            <span>Loading NFT metadata and images...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 w-full" />
        </div>
      )}

      {rootletMetadata.length > 0 ? (
        <div className="mt-4">
          <h2 className="mb-2 text-xl font-semibold">Your Rootlets:</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {rootletMetadata.map((obj) => (
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
                  <strong>Rootlet {obj.data.content.fields.number}</strong>
                  <br />
                  <span className="truncate text-sm text-gray-400">
                    Object Id: {obj.data.objectId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 text-center text-gray-400">
          {loadingMetadata
            ? loadingMessages[loadingMessageIndex]
            : "No rootlets found."}
        </div>
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
              <strong className="text-white">Object ID:</strong>
              <span
                className="block w-full cursor-pointer truncate text-white"
                onClick={() => {
                  navigator.clipboard.writeText(selectedObject.data.objectId);
                  toast.success("Object ID copied to clipboard!");
                }}
                title="Click to copy"
              >
                {selectedObject.data.objectId}
              </span>
            </p>

            <p>
              <strong className="text-white">Digest:</strong>
              <span
                className="block w-full cursor-pointer truncate text-white"
                onClick={() => {
                  navigator.clipboard.writeText(selectedObject.data.digest);
                  toast.success("Digest copied to clipboard!");
                }}
                title="Click to copy"
              >
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
                {ownedObjects.length > 0 ? (
                  <Button
                    onClick={() =>
                      receiveTokens(
                        selectedObject.data.objectId,
                        walletKit.account?.address || "",
                      )
                    }
                  >
                    Claim airdrops
                  </Button>
                ) : (
                  <Button disabled className="cursor-not-allowed opacity-50">
                    Nothing to claim
                  </Button>
                )}
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
