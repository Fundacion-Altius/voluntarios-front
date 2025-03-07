export async function getAllQuestions() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/questions`
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
    console.log({ surveyID, ratings, additionalAnswer });
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
