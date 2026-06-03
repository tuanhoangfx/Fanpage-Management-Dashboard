import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="bg-red-900/50 border-l-4 border-red-500 text-red-300 p-4 rounded-md my-8 max-w-2xl mx-auto" role="alert">
      <p className="font-bold">An Error Occurred</p>
      <p>{message}</p>
      <p className="mt-2 text-sm text-red-400">Please check if your Access Token is valid, not expired, and has the required permissions (e.g., `pages_show_list`, `pages_read_engagement`, `read_insights`, `pages_manage_posts`, `pages_manage_access`).</p>
    </div>
  );
};

export default ErrorMessage;