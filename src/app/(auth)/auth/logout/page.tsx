"use client";

import { supabase } from "@/lib/supabase";
import { Check, LogOut, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LogoutPage() {
  const [logoutStatus, setLogoutStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error("Logout error:", error);
          setError(error.message);
          setLogoutStatus("error");
        } else {
          setLogoutStatus("success");

          if (typeof window !== "undefined") {
            localStorage.clear();
            sessionStorage.clear();
          }

          setTimeout(() => {
            router.push("/auth");
          }, 2000);
        }
      } catch (err) {
        console.error("Unexpected logout error:", err);
        setError("An unexpected error occurred during logout");
        setLogoutStatus("error");
      }
    };

    handleLogout();
  }, [router]);

  const handleRetry = () => {
    setLogoutStatus("loading");
    setError(null);
    window.location.reload();
  };

  const handleGoToAuth = () => {
    router.push("/auth");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Users className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Logging Out
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {logoutStatus === "loading" && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <LogOut className="h-12 w-12 text-indigo-600 animate-pulse" />
              </div>
              <p className="text-gray-600">Signing you out...</p>
            </div>
          )}

          {logoutStatus === "success" && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Check className="h-12 w-12 text-green-600" />
              </div>
              <p className="text-gray-900 font-medium mb-2">
                Logout Successful
              </p>
              <p className="text-gray-600 text-sm mb-4">
                You have been successfully logged out. Redirecting to login...
              </p>
              <button
                onClick={handleGoToAuth}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Login
              </button>
            </div>
          )}

          {logoutStatus === "error" && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <LogOut className="h-12 w-12 text-red-600" />
              </div>
              <p className="text-gray-900 font-medium mb-2">Logout Error</p>
              <p className="text-red-600 text-sm mb-4">
                {error || "An error occurred during logout"}
              </p>
              <div className="space-y-2">
                <button
                  onClick={handleRetry}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Try Again
                </button>
                <button
                  onClick={handleGoToAuth}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
