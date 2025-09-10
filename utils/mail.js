import nodemailer from "nodemailer";


const createTransporter = () => {
  const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    //   debug: true, // Enable debug logging
    //   logger: true, // Enable logger
    //   tls: {
    //     rejectUnauthorized: false
    //   },
    //   // Increase timeouts
    //   connectionTimeout: 20000, // 20 seconds
    //   greetingTimeout: 20000,
    //   socketTimeout: 30000
  });

  // Verify connection configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.log("Transporter verification error:", error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

  return transporter
}

export default createTransporter;
