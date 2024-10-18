import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { editundo, jetbrains } from "@/styles/fonts";
import Container from "@/components/container";
import Header from "@/components/header";
import WalletProviderWrapper from "@/utilities/wallet-provider-wrapper";
import { UserProvider } from "../context/user-provider";
import { MintingProvider } from "../context/mint-provider";
import QueryProviders from "../utilities/query-client-provider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={`${jetbrains.variable} ${editundo.variable} font-default`}>
      <WalletProviderWrapper>
        <QueryProviders>
          <UserProvider>
            <MintingProvider>
              <Header />
              <Container>
                <Component {...pageProps} />
              </Container>
            </MintingProvider>
          </UserProvider>
        </QueryProviders>
      </WalletProviderWrapper>
    </main>
  );
}
