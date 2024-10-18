import { useState } from "react";
import MenuIcon from "@/components/icons/menu";
import Link from "next/link";
import { RootletsLogo } from "@/components/icons/rootlets-logo";
import { NAVS } from "@/utilities/list";
import CrossIcon from "@/components/icons/cross-icon";

const ResponsiveMenu = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div className="cursor-pointer" onClick={toggleMenu}>
        <MenuIcon />
      </div>
      <div className={`responsive-menu ${isOpen ? "open" : ""}`}>
        <div className="flex items-center justify-between">
          <RootletsLogo />
          <div onClick={toggleMenu} className="cursor-pointer text-lg">
            <CrossIcon />
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-4">
          {NAVS.map((nav) => (
            <div onClick={toggleMenu} key={nav.href}>
              <Link href={nav.href} className="text-xl">
                {nav.title}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveMenu;
