import Modal from "@/components/modal";
import { useForm, SubmitHandler } from "react-hook-form";
import { useWalletKit } from "@/lib/sui";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-provider";

type RegisterForm = {
  address: string;
  email: string;
  name: string;
};

const RegisterModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const walletKit = useWalletKit();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>();
  const { user, handleCreateUser } = useUser();

  useEffect(() => {
    setValue("address", walletKit.address as string);
  }, [walletKit.address]); //eslint-disable-line

  const onSubmit: SubmitHandler<RegisterForm> = async (data) => {
    await handleCreateUser(data);
  };

  useEffect(() => {
    if (user) {
      onClose();
    }
  }, [user]); //eslint-disable-line

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col items-center">
          <h3>Create Account</h3>
          <div className="mt-3 flex items-center gap-3">
            <h5 className="w-[50px]">Name: </h5>
            <input
              className="rounded-sm border border-primary bg-inherit pl-2 focus:border-primary focus:outline-none"
              {...register("name")}
            ></input>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <h5 className="w-[50px]">Email: </h5>
            <input
              type="email"
              className="rounded-sm border border-primary bg-inherit pl-2 focus:border-primary focus:outline-none"
              {...register("email")}
            ></input>
          </div>
          <Button size="sm" className="mt-3">
            Submit
          </Button>
        </div>
      </form>
    </Modal>
  );
};
export default RegisterModal;
