import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { AreasT, DatosContrato, ModalidadT } from "../types";
import { isUser, validateDNI } from "../utils";
interface StepOneProps {
  contractData: DatosContrato;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  nextStep: () => void;
  setDatosContrato: Dispatch<SetStateAction<DatosContrato>>;
}

const StepOne: React.FC<StepOneProps> = ({
  contractData,
  handleInputChange,
  nextStep,
  setDatosContrato,
}) => {
  const [optional, setOptional] = useState<string>("");
  const [dniError, setDniError] = useState<string>(""); // State to store DNI validation error
  const [isValidating, setIsValidating] = useState<boolean>(false); // State to show "Validating..."

  const areasOptions: AreasT[] = [
    "Reparto de Alimentos",
    "Acompañamiento en la búsqueda de empleo",
    "Coaching",
    "Formación",
    "CEPI",
    "Otra",
  ];
  const modalidadOptions: ModalidadT[] = ["Presencial", "Online", "Híbrido"];
  useEffect(() => {
    const id = contractData.id;
    if (id.length >= 9) {
      setIsValidating(true);

      const timer = setTimeout(() => {
        const dniIsValid = validateDNI(id.toUpperCase());
        setDniError(dniIsValid ? "" : "El DNI/NIE no es válido");
        setIsValidating(false);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setDniError(""); // Clear error if the input is less than 9 characters
    }
  }, [contractData.id]);

  // Variables for simplified conditional rendering
  const shouldShowValidationText = contractData.id !== "" && isValidating;
  const shouldShowSuccessMessage =
    contractData.id.length >= 9 && !dniError && !isValidating;
  const shouldShowErrorMessage = contractData.id.length >= 9 && dniError;

  return (
    <div className="step">
      <p>
        <span style={{ color: "red" }}>*</span> indica campo obligatorio
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          /* TODO: Check if id is already registered in the system */
          if (await isUser(contractData.id)) {
            alert(
              "El DNI/NIE ya está registrado en el sistema. Contáctanos para más información"
            );
            setDatosContrato({
              nombre: "",
              id: "",
              domicilio: "",
              empresa: "",
              adulto: "SI",
              telefono: "",
              email: "",
              areas: ["CEPI"],
              modalidad: ["Presencial"],
              horario: "",
              duracion: "dias",
              derechoConfidencialidad: false,
              derechoDatos: false,
              derechoImagen: false,
              fecha: "",
              lugar: "",
              firma: "",
            });
          } else {
            nextStep();
          }
        }}
      >
        <div className="form-group">
          <label htmlFor="nombre">
            NOMBRE Y APELLIDOS DEL VOLUNTARIO/A{" "}
            <span style={{ color: "red" }}>*</span>{" "}
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={contractData.nombre}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="id">
            DNI / NIE <span style={{ color: "red" }}>*</span>{" "}
          </label>
          <input
            type="text"
            data-testid="id-input"
            id="id"
            name="id"
            value={contractData.id}
            onChange={handleInputChange}
            required
          />
          {/* Simplified rendering logic */}
          {shouldShowValidationText && <p>Validando...</p>}
          {shouldShowSuccessMessage && <p data-testid="id-ok">DNI/NIE con formato válido</p>}
          {shouldShowErrorMessage && <p style={{ color: "red" }} data-testid="id-error">{dniError}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="domicilio">
            DOMICILIO <span style={{ color: "red" }}>*</span>{" "}
          </label>
          <input
            type="text"
            id="domicilio"
            name="domicilio"
            value={contractData.domicilio}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="empresa">EMPRESA / ORGANIZACIÓN</label>
          <input
            type="text"
            id="empresa"
            name="empresa"
            value={contractData.empresa}
            onChange={handleInputChange}
          />
        </div>
        <section className="form-group">
          <p>
            Mayor de edad <span style={{ color: "red" }}>*</span>{" "}
          </p>
          <div className="flex">
            <input
              type="radio"
              id="adulto"
              name="adulto"
              value="SI"
              checked={contractData.adulto === "SI"}
              onChange={handleInputChange}
            />
            <label htmlFor="adulto">SI</label>
            <input
              type="radio"
              id="menor"
              name="adulto"
              value="NO"
              checked={contractData.adulto === "NO"}
              onChange={handleInputChange}
            />
            <label htmlFor="menor">NO</label>
          </div>
        </section>
        <div className="form-group">
          <label htmlFor="telefono">
            TELÉFONO <span style={{ color: "red" }}>*</span>{" "}
          </label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            value={contractData.telefono}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">
            EMAIL <span style={{ color: "red" }}>*</span>{" "}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={contractData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <section className="form-group">
          <p>
            LA ACTIVIDAD DE VOLUNTARIADO SE ENMARCA EN UNA DE LAS SIGUIENTES
            ÁREAS <span style={{ color: "red" }}>*</span>{" "}
          </p>
          {areasOptions.map((area) => (
            <div key={area} className="flex">
              <input
                type="checkbox"
                id={area}
                name="areas"
                value={area}
                checked={
                  area === "Otra"
                    ? !!optional || contractData.areas.includes("Otra")
                    : contractData.areas.includes(area)
                }
                onChange={(e) => {
                  if (area === "Otra") {
                    if (e.target.checked) {
                      setDatosContrato((prevData) => ({
                        ...prevData,
                        areas: [...prevData.areas, "Otra"],
                      }));
                    } else {
                      setDatosContrato((prevData) => ({
                        ...prevData,
                        areas: prevData.areas.filter(
                          (a) => a !== "Otra" && a !== optional
                        ),
                      }));
                      setOptional("");
                    }
                  } else {
                    handleInputChange(e);
                  }
                }}
              />
              <label htmlFor={area}>{area}</label>
              {area === "Otra" &&
                (contractData.areas.includes("Otra") || !!optional) && (
                  <input
                    style={{ marginInlineStart: "1rem" }}
                    type="text"
                    id="otraArea"
                    name="otraArea"
                    value={optional}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setOptional(newValue);
                      setDatosContrato((prevData) => ({
                        ...prevData,
                        areas: [
                          ...prevData.areas.filter(
                            (a) => a !== optional && a !== "Otra"
                          ),
                          newValue || "Otra",
                        ],
                      }));
                    }}
                    placeholder="Especifique otra área"
                    required
                  />
                )}
            </div>
          ))}
        </section>
        {/* <section className="form-group">
          <p>
            DURACIÓN <br />
            El presente acuerdo tiene una duración de (indicar lo que proceda).
            Cualquiera de las partes puede dejar sin efecto este acuerdo
            notificándolo con una antelación de 15 días naturales.
            <span style={{ color: "red" }}>*</span>{" "}
          </p>

          {["días", "semanas", "meses", "años", "indeterminado", "otros"].map(
            (option) => (
              <div key={option} className="flex">
                <input
                  type="radio"
                  id={option}
                  name="duracion"
                  value={option}
                  onChange={(e) => {
                    if (option === "otros") {
                      setDatosContrato((prevData) => ({
                        ...prevData,
                        duracion: "",
                      }));
                    } else {
                      handleInputChange(e);
                    }
                  }}
                />
                <label htmlFor={option}>{option}</label>
                {option === "otros" &&
                  contractData.duracion !== "días" &&
                  contractData.duracion !== "semanas" &&
                  contractData.duracion !== "meses" &&
                  contractData.duracion !== "años" &&
                  contractData.duracion !== "indeterminado" && (
                    <input
                      style={{ marginLeft: "1rem" }}
                      type="text"
                      name="duracion"
                      value={contractData.duracion}
                      onChange={handleInputChange}
                      placeholder="Especifique duración"
                      required
                    />
                  )}
              </div>
            )
          )}
        </section> */}
        <section className="form-group">
          <p>
            MODALIDAD <span style={{ color: "red" }}>*</span>{" "}
          </p>
          {modalidadOptions.map((modalidad: ModalidadT) => (
            <div key={modalidad} className="flex">
              <input
                type="checkbox"
                id={modalidad}
                name="modalidad"
                value={modalidad}
                checked={contractData.modalidad.includes(modalidad)}
                onChange={handleInputChange}
              />
              <label htmlFor={modalidad}>{modalidad}</label>
            </div>
          ))}
        </section>
        <div className="form-group">
          <label htmlFor="lugar">
            LUGAR DE LA ACTIVIDAD DE VOLUNTARIADO{" "}
            <span style={{ color: "red" }}>*</span>{" "}
          </label>
          <select
            id="lugar"
            name="lugar"
            value={contractData.lugar}
            onChange={handleInputChange}
            required
          >
            <option value="">Seleccione una ciudad</option>
            <option value="Madrid">Madrid</option>
            <option value="Barcelona">Barcelona</option>
            <option value="Valencia">Valencia</option>
            <option value="Sevilla">Sevilla</option>
          </select>
        </div>
        <section className="form-group">
          <p>
            HORARIO <br />
            Las actividades se llevarán a cabo en el siguiente horario:
            <span style={{ color: "red" }}>*</span>{" "}
          </p>
          <div className="flex">
            <input
              type="radio"
              id="dias-lab-ma"
              name="horario"
              value="días laborables mañana"
              checked={contractData.horario === "días laborables mañana"}
              onChange={handleInputChange}
            />
            <label htmlFor="dias-lab-ma">Días laborables mañana</label>
          </div>
          <div className="flex">
            <input
              type="radio"
              id="dias-lab-ta"
              name="horario"
              value="días laborables tarde"
              checked={contractData.horario === "días laborables tarde"}
              onChange={handleInputChange}
            />
            <label htmlFor="dias-lab-ta">Días laborables tarde</label>
          </div>
          <div className="flex">
            <input
              type="radio"
              id="fines"
              name="horario"
              value="fines de semana"
              checked={contractData.horario === "fines de semana"}
              onChange={handleInputChange}
            />
            <label htmlFor="fines">Fines de semana</label>
          </div>
          <div className="flex">
            <input
              type="radio"
              id="ind"
              name="horario"
              value="indistinto"
              checked={contractData.horario === "indistinto"}
              onChange={handleInputChange}
            />
            <label htmlFor="ind">Indistintamente</label>
          </div>
        </section>
        <div className="buttons">
          <button type="submit">Siguiente {">"}</button>
        </div>
      </form>
    </div>
  );
};

export default StepOne;
