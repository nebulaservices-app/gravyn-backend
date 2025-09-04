import nodemailer from 'nodemailer';

// Create a transporter object using SMTP transport (for Gmail in this case)
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Use your email service provider (e.g., Gmail, Outlook, etc.)
    auth: {
        user: 'lexxovnebula@gmail.com', // Replace with your email address
        pass: 'jiwu idqa megs orhm'   // Replace with your email password or an app-specific password
    }
});

// Function to send the invitation email
const sendInvitationEmail = async (email, inviteToken, organizationName, workspaceName, customMessage) => {
    const invitationUrl = `http://localhost:7001/onboard/invite-members`;  // Link to accept the invitation

    // Email options
    const mailOptions = {
        from: 'Nebula <lexxovnebula@gmail.com>',
        to: email,                    // Receiver email
        subject: `You're Invited to Join ${organizationName} on Nebula`, // Email subject
        html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
            }
            .email-container {
              background-color: #f4f4f4;
              padding: 20px;
              border-radius: 8px;
            }
            .email-header {
              font-size: 20px;
              font-weight: bold;
            }
            .email-body {
              font-size: 16px;
              margin-top: 10px;
            }
            .btn {
              background-color: #007bff;
              color: white;
              padding: 10px 20px;
              border-radius: 5px;
              text-decoration: none;
              font-size: 16px;
              display: inline-block;
              margin-top: 20px;
            }
            .btn:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              You've Been Invited to Join ${organizationName}
            </div>
            <div class="email-body">
              <p>Hi there,</p>
              <p>You've been invited to join <strong>${organizationName}</strong> on Nebula! This is a workspace where you'll be able to collaborate and work on various projects.</p>
              <p>Here are the details of the invitation:</p>
              <ul>
                <li><strong>Workspace:</strong> ${workspaceName}</li>
                <li><strong>Role:</strong> Member</li>  <!-- You can make this dynamic -->
              </ul>
              <p>${customMessage ? customMessage : 'We are excited to have you join us!'}</p>
              <p>Please click the button below to accept your invitation and join the organization:</p>
              <a href="${invitationUrl}" class="btn">Join Now</a>
            </div>
          </div>
        </body>
      </html>
    `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Invitation email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};






export const inviteMembers = ( req, res) => {
    const email = req.body.email
    const inviteToken = 'xyz123abc'; // Example hardcoded token, generate a real one for your use case
    const organizationName = 'Nebula Technologies';  // Hardcoded organization name
    const workspaceName = 'Main Workspace';  // Hardcoded workspace name
    const customMessage = 'We are thrilled to have you on board!';  // Optional custom message
    sendInvitationEmail(email, inviteToken, organizationName, workspaceName, customMessage)
        .then(() => {
            res.status(200).json({ message: 'Invitation sent successfully!' });
        })
        .catch((error) => {
            res.status(500).json({ error: 'Error sending invitation', details: error.message });
        });
}