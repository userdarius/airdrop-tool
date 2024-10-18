// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import config from "@/config";
import { useWalletKit, suiClient } from "@/lib/sui";
import { useForm } from "react-hook-form";
import { Transaction } from "@mysten/sui/transactions";
import { Button } from "@/components/ui/button";
import Head from "next/head";
import { ShowModal } from "../mint";
import { KioskClient, KioskTransaction } from "@mysten/kiosk";

export default function ConfigPage() {
  const [data, setData] = useState<any>();
  const walletKit = useWalletKit();
  const { register, handleSubmit, control, reset } = useForm();
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const getSales = async () => {
    try {
      const sales = await suiClient.getObject({
        id: config.SALES_OBJECT_ID, // Object ID you want to fetch
        options: {
          showType: true,
          showContent: true,
          showBcs: true,
        },
      });

      const d = sales?.data?.content?.fields;
      reset({
        admin_cap: config.ADMIN_CAP,
        active: d?.active,
        max_mints: d?.max_mints?.join(","),
        prices: d?.prices?.join(","),
        start_times: d?.start_times?.join(","),
        total_quantity: d?.max_mint_amount,
        max_mints_per_phase: d?.max_mints_per_phase?.join(","),
      });

      setData(sales?.data?.content?.fields);
    } catch (error) {
      console.error("Error get sales", error);
    }
  };

  useEffect(() => {
    getSales();
  }, []);

  const onSubmit = async (data) => {
    try {
      const tx = new Transaction();
      // CREATE SALE
      // tx.moveCall({
      //   target: `${config.PACKAGE}::${config.MODULE_NAME}::new_sale_v2`,
      //   arguments: [tx.object(data?.admin_cap)],
      // });

      // SET ACTIVE
      tx.moveCall({
        target: `${config.PACKAGE}::${config.MODULE_NAME}::set_active_v2`,
        arguments: [
          tx.object(config.SALES_OBJECT_ID),
          tx.object(data?.admin_cap),
          tx.pure.bool(data?.active),
        ],
      });

      // SET START TIMES
      tx.moveCall({
        target: `${config.PACKAGE}::${config.MODULE_NAME}::set_start_times_v2`,
        arguments: [
          tx.object(config.SALES_OBJECT_ID),
          tx.object(data?.admin_cap),
          tx.pure.vector(
            "u64",
            data?.start_times?.split(",")?.map((i) => Number(i)),
          ),
        ],
      });

      // SET PRICES
      tx.moveCall({
        target: `${config.PACKAGE}::${config.MODULE_NAME}::set_prices_v2`,
        arguments: [
          tx.object(config.SALES_OBJECT_ID),
          tx.object(data?.admin_cap),
          tx.pure.vector(
            "u64",
            data?.prices?.split(",")?.map((i) => Number(i)),
          ),
        ],
      });

      // SET MAX MINTS
      tx.moveCall({
        target: `${config.PACKAGE}::${config.MODULE_NAME}::set_max_mints_v2`,
        arguments: [
          tx.object(config.SALES_OBJECT_ID),
          tx.object(data?.admin_cap),
          tx.pure.vector(
            "u64",
            data?.max_mints?.split(",")?.map((i) => Number(i)),
          ),
        ],
      });

      // SET MAX MINTS PER PHASE
      tx.moveCall({
        target: `${config.PACKAGE}::${config.MODULE_NAME}::max_mints_per_phase`,
        arguments: [
          tx.object(config.SALES_OBJECT_ID),
          tx.object(data?.admin_cap),
          tx.pure.vector(
            "u64",
            data?.max_mints_per_phase?.split(",")?.map((i) => Number(i)),
          ),
        ],
      });

      // SET TOTAL QUANTITY
      // tx.moveCall({
      //   target: `${config.PACKAGE}::${config.MODULE_NAME}::set_max_mint_amount_v2`,
      //   arguments: [
      //     tx.object(config.SALES_OBJECT_ID),
      //     tx.object(data?.admin_cap),
      //     tx.pure.u64(data?.total_quantity),
      //   ],
      // });

      await walletKit.signAndExecuteTransaction({
        transaction: tx,
      });

      setMessage("Successfully updated the configuration.");
      setIsOpenModal(true);
    } catch (error) {
      console.log(error);
      setMessage(error?.toString());
      setIsOpenModal(true);
      return;
    }
  };

  return (
    <>
      <Head>
        <title>Config and Airdrop Pass Page</title>
      </Head>
      <div className="mb-8 text-3xl">Config</div>
      <ShowModal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        message={message}
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-lgp-4 space-y-4 shadow-md"
      >
        <div>
          <label className="block text-sm font-medium text-white">
            Admin Cap:
          </label>
          <input
            type="text"
            {...register(`admin_cap`)}
            className="mb-2 mt-1 block w-full rounded-md border border-gray-300 bg-transparent p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="font-semibold">Active:</label>
          <input
            type="checkbox"
            {...register("active")}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-white">
              Max Mints:
            </label>
            <input
              type="text"
              {...register(`max_mints`)}
              className="mb-2 mt-1 block w-full rounded-md border border-gray-300 bg-transparent p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="text-white0 block text-sm font-medium">
              Prices:
            </label>

            <input
              type="text"
              {...register(`prices`)}
              className="mb-2 mt-1 block w-full rounded-md border border-gray-300 bg-transparent p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-white">
              Start Times:
            </label>
            <input
              type="text"
              {...register(`start_times`)}
              className="mb-2 mt-1 block w-full rounded-md border border-gray-300 bg-transparent p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">
              Total Quantity:
            </label>
            <input
              type="text"
              {...register("total_quantity")}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-transparent p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-white">
            Max Mint Per Phase:
          </label>
          <input
            type="text"
            {...register(`max_mints_per_phase`)}
            className="mb-2 mt-1 block w-full rounded-md border border-gray-300 bg-transparent p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <Button type="submit" className="w-full rounded-sm">
          Submit
        </Button>
      </form>

      <div className="mb-8 mt-12 text-3xl">Airdrop Pass</div>
      <AirdropPass />

      <div className="mb-8 mt-12 text-3xl">Admin Mint</div>
      <AdminMint />
    </>
  );
}

const AirdropPass = () => {
  const { register, handleSubmit, control, reset } = useForm();
  const walletKit = useWalletKit();
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const onSubmit = async (data) => {
    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${config.PACKAGE}::${config.MODULE_NAME}::airdrop_pass`,
        arguments: [
          tx.object(data?.admin_cap),
          tx.pure.u64(data?.whitelist),
          tx.pure.address(data?.address),
        ],
      });

      await walletKit.signAndExecuteTransaction({
        transaction: tx,
      });

      setMessage("Airdrop pass sent successfully.");
      setIsOpenModal(true);
    } catch (error) {
      console.log(error);
      setMessage(error?.toString());
      setIsOpenModal(true);
    }
  };
  return (
    <>
      <ShowModal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        message={message}
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-lgp-4 space-y-4 shadow-md"
      >
        <div>
          <label className="block text-sm font-medium text-white">
            Admin Cap:
          </label>
          <input
            type="text"
            {...register(`admin_cap`)}
            className="mb-2 mt-1 block w-full rounded-md border border-gray-300 bg-transparent p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-white">
              Address:
            </label>
            <input
              type="text"
              {...register(`address`)}
              className="mb-2 mt-1 block w-full rounded-md border border-gray-300 bg-transparent p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="text-white0 block text-sm font-medium">
              Whitelist Number (1 / 2):
            </label>

            <input
              type="text"
              {...register(`whitelist`)}
              className="mb-2 mt-1 block w-full rounded-md border border-gray-300 bg-transparent p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <Button type="submit" className="w-full rounded-sm">
          Submit
        </Button>
      </form>
    </>
  );
};

const AdminMint = () => {
  const { register, handleSubmit, control, reset } = useForm();
  const walletKit = useWalletKit();
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const kioskClient = new KioskClient({
    client: suiClient,
    network: config.SUI_NETWORK,
  });

  const onSubmit = async (data) => {
    try {
      const tx = new Transaction();

      tx.setGasBudget(50_000_000);
      const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({
        address: data.address,
      });

      const cap = kioskOwnerCaps.find((cap) => cap.isPersonal);

      const kioskTx = new KioskTransaction({
        kioskClient: kioskClient,
        transaction: tx,
        cap,
      });

      if (!cap) {
        kioskTx.createPersonal(true);
      }

      tx.moveCall({
        target: `${config.PACKAGE}::${config.MODULE_NAME}::admin_mint_v2`,
        arguments: [
          tx.object(config.SALES_OBJECT_ID), // sale: &mut Sale
          tx.object(config.TRANSFER_POLICY_MUT), // policy: &TransferPolicy<Rootlet>,
          tx.object(config.COLLECTION_DATA), // collection: &mut CollectionData,
          tx.object(data?.admin_cap),
          kioskTx.getKiosk(), // kiosk: &mut Kiosk,
          kioskTx.getKioskCap(), // cap: &KioskOwnerCap,
        ],
      });

      kioskTx.finalize();

      await walletKit.signAndExecuteTransaction({
        transaction: tx,
      });

      setMessage("Admin mint sent successfully.");
      setIsOpenModal(true);
    } catch (error) {
      console.log(error);
      setMessage(error?.toString());
      setIsOpenModal(true);
    }
  };
  return (
    <>
      <ShowModal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        message={message}
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-lgp-4 mb-12 space-y-4 shadow-md"
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-white">
              Admin Cap:
            </label>
            <input
              type="text"
              {...register(`admin_cap`)}
              className="mb-2 mt-1 block w-full rounded-md border border-gray-300 bg-transparent p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white">
              Address:
            </label>
            <input
              type="text"
              {...register(`address`)}
              className="mb-2 mt-1 block w-full rounded-md border border-gray-300 bg-transparent p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <Button type="submit" className="w-full rounded-sm">
          Submit
        </Button>
      </form>
    </>
  );
};
