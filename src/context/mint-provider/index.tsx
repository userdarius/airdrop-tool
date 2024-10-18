import React, { createContext, useContext, ReactNode } from "react";

interface MintingData {
  walletAddress: string;
  totalMint: number;
  phase: string;
}

interface MintingContextType {
  getCurrentTotalMint: (walletAddress: string, phase: string) => number;
  addMintForCurrentWallet: (
    walletAddress: string,
    mintAmount: number,
    phase: string,
  ) => void;
}

const MintingContext = createContext<MintingContextType | undefined>(undefined);

const MintingProvider = ({ children }: { children: ReactNode }) => {
  const getMintingData = (): MintingData[] => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("mintingData_1");
      return data ? JSON.parse(data) : [];
    }
    return [];
  };

  const saveMintingData = (data: MintingData[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mintingData_1", JSON.stringify(data));
    }
  };

  const getCurrentTotalMint = (
    walletAddress: string,
    phase: string,
  ): number => {
    const mintingData = getMintingData();
    const walletData = mintingData.find(
      (data) => data.walletAddress === walletAddress && data.phase === phase,
    );
    return walletData ? walletData.totalMint : 0;
  };

  const addMintForCurrentWallet = (
    walletAddress: string,
    mintAmount: number,
    phase: string,
  ) => {
    const mintingData = getMintingData();
    const walletIndex = mintingData.findIndex(
      (data) => data.walletAddress === walletAddress && data.phase === phase,
    );

    if (walletIndex !== -1) {
      mintingData[walletIndex].totalMint += mintAmount;
    } else {
      mintingData.push({ walletAddress, totalMint: mintAmount, phase });
    }

    saveMintingData(mintingData);
  };

  return (
    <MintingContext.Provider
      value={{ getCurrentTotalMint, addMintForCurrentWallet }}
    >
      {children}
    </MintingContext.Provider>
  );
};

const useMinting = () => {
  const context = useContext(MintingContext);
  if (!context) {
    throw new Error("useMinting must be used within a MintingProvider");
  }
  return context;
};

export { MintingProvider, useMinting };
