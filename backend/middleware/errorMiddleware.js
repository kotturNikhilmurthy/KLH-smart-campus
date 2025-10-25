import multer from "multer";

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({ success: false, message: "Resource not found", data: null });
};

export const errorHandler = (err, req, res, next) => {
  console.error("API error", err);
  let status = err.status || 500;
  let message = err.message || "Internal server error";

  if (err instanceof multer.MulterError) {
    status = 400;
    message = err.message;
  } else if (message === "Only image uploads are allowed") {
    status = 400;
  }

  res.status(status).json({ success: false, message, data: null });
};
