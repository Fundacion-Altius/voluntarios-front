"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { StarRating } from "@/components/ratings/star-rating";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Question, SurveySubmission } from "@/app/types";
import { useRouter } from "next/navigation";

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
  const [submitError, setSubmitError] = useState<string>("");
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError("");
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const submission: SurveySubmission = {
        surveyID: 1,
        ratings,
        additionalAnswer: additionalAnswer || undefined
      };
      
      const res = await fetch(`${API_URL}/api/surveys/submit-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error("Error submitting survey");
      }
      
      router.push("/encuesta/confirmacion");
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError("Error al enviar la encuesta. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAdditionalAnswer(e.target.value);
  };

  return (
    <>
      {error && <div className="flex justify-center text-red-500">{error}</div>}
      {submitError && <div className="flex justify-center text-red-500 mb-4">{submitError}</div>}
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
            <Button
              className="mt-2"
              type="submit"
              disabled={isDisabled || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </div>
        </form>
      )}
    </>
  );
}