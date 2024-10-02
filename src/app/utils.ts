const HOST = process.env.NEXT_PUBLIC_API_URL;
export function todayToSQL() {
  const date = new Date();
  const formattedDate = date.toISOString().slice(0, 19).replace("T", " ");
  return formattedDate;
}
export async function isUser(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${HOST}/api/contracts/${id}`);
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
  let number = nie.slice(1, 8);

  // NIE starts with X, Y, or Z: replace with 0, 1, or 2 respectively
  if (niePrefix === "X") niePrefix = "0";
  if (niePrefix === "Y") niePrefix = "1";
  if (niePrefix === "Z") niePrefix = "2";

  const combinedNumber = parseInt(niePrefix + number, 10);
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
  const letter = nie[8];

  return letters[combinedNumber % 23] !== letter ? false : true;
}
