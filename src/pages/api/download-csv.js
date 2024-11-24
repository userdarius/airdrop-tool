import path from "path";
import fs from "fs";
export default async function handler(req, res) {
  const csvFilePath = path.join(path.resolve(), "data", "rootlets-nfts.csv");

  // Check if the file exists
  if (!fs.existsSync(csvFilePath)) {
    res.status(404).json({ error: "CSV file not found" });
    return;
  }

  // Set headers for file download
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="rootlets-nfts.csv"`);

  // Send the file content as a response
  const fileStream = fs.createReadStream(csvFilePath);
  fileStream.pipe(res);
}
