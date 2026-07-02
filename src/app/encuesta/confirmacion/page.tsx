import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
const imagePrefix = `${process.env.NEXT_PUBLIC_IMAGE_PREFIX || '/'}`.replace(/\/$/, '');
const Contract: React.FC = () => {
  return (
    <main>
      <div className="w-full flex md:max-w-[640px] mx-auto mb-2">
        <a href="/">
          <Image
            alt="logo"
            src={`${imagePrefix}/logo.png`}
            width={400}
            height={100}
            className="logo"
            priority
          />
        </a>
      </div>
      <div className="contract-wizard">
        <h2>Encuesta voluntariado de la Fundación Altius</h2>
        <h3 className="mb-3">¡Gracias!</h3>
        <p>Tu respuesta nos ayudará a seguir prestando el mejor servicio posible.</p>
        {/* <div className="flex w-full mt-10">
          <Button className="flex w-full">
            <Home />
            <a href={"/"}>Volver al inicio</a>
          </Button>
        </div> */}
      </div>
    </main>
  );
};

export default Contract;
