// const HOST = process.env.NEXT_PUBLIC_API_URL;
import { v4 as uuidv4 } from "uuid";

export function todayToSQL() {
  const date = new Date();
  const formattedDate = date.toISOString().slice(0, 19).replace("T", " ");
  return formattedDate;
}
export async function isUser(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/contracts/${id}`);
    if (response.status === 200) {
      return true;
    }
  } catch (error) {
    console.error("Error submitting contract:", error);
  }
  return false;
}

// validateDNI.ts
export function validateDNI(id: string): boolean {
  const dniRegex = /^\d{8}[A-HJ-NP-TV-Z]$/;
  const nieRegex = /^[XYZ]\d{7}[A-HJ-NP-TV-Z]$/;

  if (dniRegex.test(id)) {
    return validateDNILetter(id);
  }
  if (nieRegex.test(id)) {
    return validateNIELetter(id);
  }
  return false;
}

function validateDNILetter(dni: string): boolean {
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
  const number = parseInt(dni.slice(0, 8), 10);
  const letter = dni[8];
  return letters[number % 23] !== letter ? false : true;
}

function validateNIELetter(nie: string): boolean {
  let niePrefix = nie[0];
  const number = nie.slice(1, 8);

  // NIE starts with X, Y, or Z: replace with 0, 1, or 2 respectively
  if (niePrefix === "X") niePrefix = "0";
  if (niePrefix === "Y") niePrefix = "1";
  if (niePrefix === "Z") niePrefix = "2";

  const combinedNumber = parseInt(niePrefix + number, 10);
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
  const letter = nie[8];

  return letters[combinedNumber % 23] !== letter ? false : true;
}
export function formatMonth(isoDateStr: string): string {
  const date = new Date(isoDateStr);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${month} ${year}`;
}

export function formatFullMonthYear(isoDateStr: string) {
  const date = new Date(isoDateStr);
  return date.toLocaleDateString("es-es", { month: "long", year: "numeric" });
}
export const handleDownload = async (id: string) => {
  try {
    const response = await fetch(`/api/generate-pdf?id=${id}`);
    if (response.status === 400) {
      throw new Error(
        "No se puede generar dos veces el mismo contrato para el mismo DNI/NIE. Recarga para intentar con otro DNI/NIE"
      );
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `contrato${uuidv4()}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return "Ok";
  } catch (error) {
    // logger.error(`Error downloading PDF: ${error}`);
    alert(error);
    return `Error submitting contract:, ${error}`;
  }
};
export function formatDateToDDMMYYYY(isoDate: string): string {
  // Parse the ISO date string into a Date object
  const date = new Date(isoDate);

  // Validate the date
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  // Extract day, month, and year
  const day = String(date.getDate()).padStart(2, "0"); // Ensure two digits
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const year = date.getFullYear();

  // Return the formatted date as DD-MM-YYYY
  return `${day}/${month}/${year}`;
}
export function capitalize(str: string): string {
  return str.split(" ").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}