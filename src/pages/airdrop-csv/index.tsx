/* eslint-disable react/react-in-jsx-scope */
import { Button } from "@/components/ui/button";
import Head from "next/head";

export default function DownloadCsvPage() {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/api/download-csv"; // Route to serve the CSV file
    link.download = "rootlets-nfts.csv";
    link.click();
  };

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Download Rootlets CSV</title>
      </Head>
      <h1 className="text-2xl font-bold mb-4">Download Rootlets CSV</h1>
      <p className="mb-4">
        Click the button below to download the CSV file containing all Rootlets
        IDs. You can use this to airdrop to Rootlets NFTs directly.
      </p>
      <Button onClick={handleDownload}>Download CSV</Button>
    </div>
  );
}
