import CrossIcon from "@/components/icons/cross-icon";

const Modal = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  return (
    <>
      {isOpen ? (
        <div className="fixed left-0 top-0 z-10 flex h-screen w-screen items-center justify-center">
          <div
            onClick={onClose}
            className="absolute left-0 top-0 z-10 h-full w-full bg-black opacity-50"
          ></div>
          <div className="relative z-20 w-full max-w-[580px] px-4">
            <section className="relative rounded-lg border border-primary bg-background px-3 pb-[42px] pt-[34px]">
              <div
                onClick={onClose}
                className="absolute right-0 top-0 mr-[10px] mt-[10px] flex h-[35px] w-[35px] cursor-pointer items-center justify-center rounded-full bg-[#040405]"
              >
                <CrossIcon />
              </div>
              {children}
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Modal;
