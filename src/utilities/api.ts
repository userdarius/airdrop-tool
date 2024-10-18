import axios, { AxiosError } from "axios";
import config from "@/config";

const api = axios.create({
  baseURL: config.API_HOST,
  timeout: 40000,
  withCredentials: true,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json; charset=utf-8",
  },
});

export const createErrorMessage = (error: any | AxiosError) => {
  let message = "Something went wrong.";
  if (axios.isAxiosError(error)) {
    const errMsg = error.response?.data?.message || error.message;
    if (Array.isArray(errMsg)) {
      message = errMsg?.shift();
    } else {
      message = errMsg;
    }
  }

  return message;
};

export default api;
