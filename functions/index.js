const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize the Firebase Admin SDK
admin.initializeApp();

// To use this, you'll need to configure your email and password as environment variables.
// In your terminal, run these commands from the `functions` directory:
// firebase functions:config:set gmail.email="your-email@gmail.com"
// firebase functions:config:set gmail.password="your-gmail-app-password"
// IMPORTANT: Use a Gmail "App Password", not your regular password.
// See: https://support.google.com/accounts/answer/185833
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;

// Create a "transporter" object that can send emails
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// This is our Cloud Function, triggered when a new user is created.
exports.sendNewRestaurantNotification = functions.firestore
    .document("users/{userId}")
    .onCreate(async (snap, context) => {
      const newUser = snap.data();

      // Only send an email if the new user is a restaurant pending approval
      if (newUser.role !== "restaurant" ||
        newUser.approvalStatus !== "pending") {
        console.log("Not a new restaurant, skipping email.");
        return null;
      }

      console.log("New restaurant registered:", newUser.email);

      const mailOptions = {
        from: `"Snaccit Admin" <${gmailEmail}>`,
        to: gmailEmail, // Sending the notification to yourself (the admin)
        subject: "New Restaurant Registration Pending Approval!",
        html: `
          <h1>New Restaurant Registration</h1>
          <p>A new restaurant has registered on Snaccit and is waiting for your approval.</p>
          <h2>Details:</h2>
          <ul>
            <li><strong>Restaurant Name:</strong> ${newUser.restaurantName || "Not Provided"}</li>
            <li><strong>Email:</strong> ${newUser.email}</li>
            <li><strong>FSSAI License:</strong> ${newUser.fssaiLicense}</li>
            <li><strong>User ID:</strong> ${context.params.userId}</li>
          </ul>
          <p>Please log in to the Firebase console to review and approve their account.</p>
        `,
      };

      try {
        await mailTransport.sendMail(mailOptions);
        console.log("Approval notification email sent to:", gmailEmail);
      } catch (error) {
        console.error("There was an error while sending the email:", error);
      }

      return null;
    });
