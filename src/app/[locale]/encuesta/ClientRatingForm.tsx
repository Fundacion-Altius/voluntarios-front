"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { StarRating } from "@/components/ratings/star-rating";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Question, SurveySubmission } from "@/app/types";
import { useRouter } from "@/i18n/navigation";
import { getApiBaseUrl } from '@/lib/apiUrl';

interface ClientRatingFormProps {
  questions: Question[];
  error: string;
}

interface Ratings {
  [questionId: number]: number;
}

export default function ClientRatingForm({
  questions: serverQuestions,
  error: serverError,
}: ClientRatingFormProps) {
  const t = useTranslations('encuesta');
  const [ratings, setRatings] = useState<Ratings>({});
  const [additionalAnswer, setAdditionalAnswer] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [queued, setQueued] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>(serverQuestions);
  const [error, setError] = useState<string>(serverError);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const API_URL = getApiBaseUrl();
    fetch(`${API_URL}/api/questions`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to fetch questions'))))
      .then((data: Question[]) => {
        if (cancelled) return;
        if (data.length > 0 || serverQuestions.length === 0) {
          setQuestions(data);
          setError("");
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (serverQuestions.length === 0 && !serverError) {
          setError(serverError);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [serverQuestions, serverError]);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => {
      setIsOffline(false);
      navigator.serviceWorker?.controller?.postMessage({ type: 'survey-replay' });
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for SW queue updates
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'survey-queue-update') {
        if (event.data.queued === 0) {
          setQueued(false);
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    // Ask SW for current queue status on mount
    navigator.serviceWorker?.controller?.postMessage({ type: 'survey-queue-status' });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, []);

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
    setQueued(false);

    const API_URL = getApiBaseUrl();
    const submission: SurveySubmission = {
      surveyID: 1,
      ratings,
      additionalAnswer: additionalAnswer || undefined
    };

    try {
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
      setLoading(false);

      // If offline or network error, queue via SW
      if (!navigator.onLine || (err instanceof TypeError && err.message === 'Failed to fetch')) {
        navigator.serviceWorker?.controller?.postMessage({
          type: 'survey-enqueue',
          payload: {
            submission,
            url: `${API_URL}/api/surveys/submit-answer`,
          },
        });
        setQueued(true);
        setSubmitError(t('offlineGuardado'));
      } else {
        setSubmitError(t('errorEnvioEncuesta'));
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAdditionalAnswer(e.target.value);
  };

  return (
    <>
      {error && <div className="flex justify-center text-red-500">{error}</div>}
      {isOffline && (
        <div className="flex justify-center text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-4 py-2 mb-4">
          {t('offlineIndicador')}
        </div>
      )}
      {queued && (
        <div className="flex justify-center text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-4 py-2 mb-4">
          {t('offlineGuardado')}
        </div>
      )}
      {submitError && <div className="flex justify-center text-red-500 mb-4">{submitError}</div>}
      {questions.length === 0 && !error ? (
        <div className="flex justify-center">{t('cargandoPreguntas')}</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2>
            {t('graciasParticipacion')}
          </h2>
          <p>
            {t('mejorarEncuesta')}
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
              <p>{t('algoAdicional')}</p>
              <Input
                placeholder={t('placeholderRespuesta')}
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
              {t('enviar')}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
