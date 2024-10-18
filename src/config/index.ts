export type Config = {
  API_HOST: string;
  SALES_OBJECT_ID: string;
  SUI_RATE: string;
  COLLECTION_DATA: string;
  PACKAGE: string;
  ADMIN_CAP: string;
  MODULE_NAME: string;
  PACKAGE_V1: string;
  TRANSFER_POLICY_MUT: string;
  HIDE_MINT: string;
  SUI_NETWORK: string;
  KIOSK: string;
  REVEAL_PACKAGE: string;
};

const config: Config = {
  API_HOST: process.env.NEXT_PUBLIC_API_HOST || "",
  SALES_OBJECT_ID: process.env.NEXT_PUBLIC_SALES_OBJECT_ID || "",
  SUI_RATE: process.env.NEXT_PUBLIC_SUI_RATE || "",
  COLLECTION_DATA: process.env.NEXT_PUBLIC_COLLECTION_DATA || "",
  PACKAGE: process.env.NEXT_PUBLIC_PACKAGE || "",
  ADMIN_CAP: process.env.NEXT_PUBLIC_ADMIN_CAP || "",
  MODULE_NAME: process.env.NEXT_PUBLIC_MODULE_NAME || "",
  PACKAGE_V1: process.env.NEXT_PUBLIC_PACKAGE_V1 || "",
  TRANSFER_POLICY_MUT: process.env.NEXT_PUBLIC_TRANSFER_POLICY_MUT || "",
  HIDE_MINT: process.env.NEXT_PUBLIC_HIDE_MINT || "",
  SUI_NETWORK: process.env.NEXT_PUBLIC_SUI_NETWORK || "",
  KIOSK: process.env.NEXT_PUBLIC_KIOSK || "",
  REVEAL_PACKAGE: process.env.NEXT_PUBLIC_REVEAL_PACKAGE || "",
};

export { config };

export default config;
