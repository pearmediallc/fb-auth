"use client";

import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleLogin = () => {
    window.location.href = "/api/auth/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Meta Ad Account Checker
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to view and manage your ad accounts
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">
              {error === "auth_failed" 
                ? "Authentication failed. Please try again."
                : "An error occurred. Please try again."}
            </div>
          </div>
        )}
        
        <div>
          <button
            onClick={handleLogin}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
            </svg>
            Continue with Facebook
          </button>
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-600">
          <p>This app will request the following permissions:</p>
          <ul className="mt-2 space-y-1">
            <li>• Public Profile</li>
            <li>• Ads Read</li>
            <li>• Business Management</li>
            <li>• Pages Show List</li>
          </ul>
        </div>
      </div>
    </div>
  );
}