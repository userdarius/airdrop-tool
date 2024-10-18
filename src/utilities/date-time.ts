export const formatTimestamp = (microseconds: number) => {
  const milliseconds = Math.floor(microseconds);
  const date = new Date(milliseconds);
  const now = new Date();
  const timeDifference = now.getTime() - date.getTime();
  if (timeDifference < 86400000) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  } else {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};
