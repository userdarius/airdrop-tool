import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";

export const editundo = localFont({
  src: "./editundo.woff",
  display: "swap",
  variable: "--font-editundo",
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});
