import Image from "next/image";
import ClientRatingForm from "./ClientRatingForm";
import { getAllQuestions } from "../lib/api";
import { Question } from "../types";


export default async function RatingPage() {
  let questions: Question[] = [];
  let error: string = "";

  try {
    questions = await getAllQuestions();
  } catch (err) {
    console.error(err);
    error = "Error al cargar las preguntas";
  }
  
  const imagePrefix = process.env.NEXT_PUBLIC_IMAGE_PREFIX;

  return (
    <main>
      <div className="flex w-full justify-center mb-10 md:justify-start md:max-w-[630px] md:mx-auto">
        <a href="/">
          <div className="flex">
            <Image
              alt="logo"
              src={`${imagePrefix}logo.png`}
              width={400}
              height={100}
              className="logo"
              priority
            />
          </div>
        </a>
      </div>
      <div className="contract-wizard">
        <ClientRatingForm questions={questions} error={error} />
      </div>
    </main>
  );
}
