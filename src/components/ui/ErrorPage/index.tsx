"use client";

import { Frown } from "lucide-react";
import { ErrorPageProps } from "./Types";

const ErrorPage = ({
  Icon = Frown,
  title = "404",
  description = "Page not found",
  errorDescription = "We're sorry we can't find the page you are looking for.",
  buttonLabel = "Back to Home Page",
  onButtonClick,
}: ErrorPageProps) => {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="rotate-3 transform rounded-lg bg-white shadow-xl">
        <div className="w-[90vw] max-w-lg -rotate-4 transform p-8 text-center">
          <div className="mb-4 flex justify-center">
            <Icon size="50px" />
          </div>
          <h1 className="text-3xl text-[#373737]">{title}</h1>
          <p className="text-[#2C2C2C99]">{description}</p>

          <p className="my-10 text-black" onClick={onButtonClick}>
            {errorDescription}
          </p>
          <button
            onClick={onButtonClick}
            className="cursor-pointer rounded bg-black px-5 py-2 text-sm font-semibold text-white uppercase transition hover:bg-gray-800"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
