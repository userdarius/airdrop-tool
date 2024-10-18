import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  ReactNode,
} from "react";
import { useWalletKit } from "@/lib/sui";
import { getUserProfileByAddress, createUser } from "@/fetchers/users";
import { useMutation, useQuery } from "@tanstack/react-query";

type User = {
  address: string;
  name: string;
  email: string;
};

type UserProviderProps = {
  children: ReactNode;
};

type UserContextType = {
  user: User | null;
  getUser: () => Promise<void>;
  handleCreateUser: (body: User) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

//Note : Some code is not being used for now because there is no connection to the backend yet.

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const walletKit = useWalletKit();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!walletKit.connected) {
      setUser(null);
    }
  }, [walletKit.connected]);
  // const query = useQuery({
  //   queryKey: ["user", walletKit.address],
  //   queryFn: () => getUserProfileByAddress(walletKit.address as string),
  // });

  // useEffect(() => {
  //   if (query.data) {
  //     setUser(query?.data);
  //   }
  // }, [query.data]);

  const getUser = useCallback(async () => {
    if (walletKit.connected && walletKit.address) {
      try {
        const fetchedUser = await getUserProfileByAddress(walletKit.address);
        setUser(fetchedUser);
      } catch (error) {
        console.error("Error fetching wallet account", error);
      }
    }
  }, [walletKit.connected, walletKit.address]);

  const create = useMutation({
    mutationFn: (body: User) => createUser(body),
    onSuccess: () => {
      // query.refetch();
    },
    onError: (err) => {},
  });

  const handleCreateUser = (body: User) => {
    return create.mutate(body);
  };

  return (
    <UserContext.Provider value={{ user, getUser, handleCreateUser }}>
      {children}
    </UserContext.Provider>
  );
};
