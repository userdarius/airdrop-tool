import api from "@/utilities/api";

type User = {
  address: string;
  name: string;
  email: string;
};

export async function getUserProfileByAddress(
  address: string,
): Promise<User | null> {
  try {
    const { data: res } = await api.get(`/users/${address}`);

    return res;
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
  return null;
}

export async function createUser(data: User): Promise<User> {
  const { data: res } = await api.post("/users", data);

  return res;
}
