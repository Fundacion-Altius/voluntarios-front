import { redirect } from "next/navigation";

import { LoginPayload, RegisterPayload } from "../types";

export async function getAllQuestions() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/questions`
    // "/api/questions"
  );
  const data = await response.json();
  return data;
}
export async function submitAnswer({
  surveyID,
  ratings,
  additionalAnswer,
}: {
  surveyID: number;
  ratings: Record<number, number>;
  additionalAnswer?: string;
}) {
  try {
    const response = await fetch("/api/surveys/submit-answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        surveyID,
        ratings,
        additionalAnswer,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}
export async function getSurveyResults() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/surveys/get-report`
  );
  const data = await response.json();
  return data;
}
export async function register(formData: FormData) {
  const registerPayload: RegisterPayload = {
    name: formData.get("name") as string,
    password: formData.get("password") as string,
    email: formData.get("email") as string,
  };
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerPayload),
    }
  );
  const result = await response.json();
  if (!result.success) {
    return { result, error: result.error };
  }
  return { result: true, data: result.data };
}

export async function login(formData: FormData) {
  const loginPayload: LoginPayload = {
    password: formData.get("password") as string,
    email: formData.get("email") as string,
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signin`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginPayload),
    }
  );
  const result = await response.json();
  if (!result.success) {
    return { result, error: result.error };
  }
  return { result: true, data: result.data };
}

export async function getContracts() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/contracts`
  );
  const result = await response.json();
  if (!result) {
    return { result: false, error: "Problem with server. Try again"}
  }
  return { result: true, data: result };
}

export async function getContract(id:string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/contracts/${id}`
  );
  const result = await response.json();
  if (!result) {
    return { result: false, error: "Problem with server. Try again"}
  }
  return { result: true, data: result };
}