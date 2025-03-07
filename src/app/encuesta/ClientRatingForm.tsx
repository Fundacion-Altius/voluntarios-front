"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { StarRating } from "@/components/ratings/star-rating";
import { Input } from "@/components/ui/input";
import { Question } from "../types";
import { useRouter } from "next/navigation";
import { submitAnswer } from "../lib/api";
import LoadingButton from "@/components/loading-button";

interface ClientRatingFormProps {
  questions: Question[];
  error: string;
}

interface Ratings {
  [questionId: number]: number;
}

export default function ClientRatingForm({
  questions,
  error,
}: ClientRatingFormProps) {
  const [ratings, setRatings] = useState<Ratings>({});
  const [additionalAnswer, setAdditionalAnswer] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const isDisabled: boolean = questions.length
    ? Object.keys(ratings).length !== questions.length
    : true;

  const handleRatingChange = (questionId: number, newRating: number) => {
    setRatings((prevRatings) => ({
      ...prevRatings,
      [questionId]: newRating,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // For now, we simply log the data.
    console.log("Ratings:", ratings);
    console.log("Additional answer:", additionalAnswer);
    const surveyID = 1;
    submitAnswer({surveyID, ratings, additionalAnswer});
    router.push("/encuesta/confirmacion");
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAdditionalAnswer(e.target.value);
  };

  return (
    <>
      {error && <div className="flex justify-center">{error}</div>}
      {questions.length === 0 && !error ? (
        <div className="flex justify-center">Cargando preguntas...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2>
            ¡Gracias por haber participado en nuestras actividades de
            voluntariado con nosotros en la Fundación Altius!
          </h2>
          <p>
            Para mejorar te pedimos por favor que llenes esta encuesta anónima:
          </p>
          <ol className="list-decimal ml-5">
            {questions.map((question: Question) => (
              <li key={question.id} className="mb-4">
                <p>{question.text}</p>
                <div className="mb">
                  <StarRating
                    value={ratings[question.id] || 0}
                    onChange={(newRating: number) =>
                      handleRatingChange(question.id, newRating)
                    }
                    maxRating={5}
                    size="w-6 h-6"
                  />
                </div>
              </li>
            ))}
            <li>
              <p>¿Algo adicional que quieras añadir?</p>
              <Input
                placeholder="Ingresa tu respuesta..."
                value={additionalAnswer}
                onChange={handleInputChange}
              />
            </li>
          </ol>
          <div className="flex justify-end">
            <LoadingButton
              isLoading={loading}
              disabled={isDisabled}
              className="mt-2"
              type="submit"
            >
              Enviar
            </LoadingButton>
          </div>
        </form>
      )}
    </>
  );
}
