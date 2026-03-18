import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendProductRejectionEmail({
  toEmail,
  producerName,
  productName,
  rejectionNote,
}: {
  toEmail: string
  producerName: string
  productName: string
  rejectionNote: string
}) {
  // If RESEND_API_KEY is not set, skip silently
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set - skipping product rejection email')
    return
  }

  try {
    await resend.emails.send({
      from: "Cornucopia <support@cornucopialocal.com>",
      to: toEmail,
      subject: `Your product "${productName}" needs attention`,
      html: `
        <p>Hi ${producerName},</p>
        <p>Thank you for submitting <strong>${productName}</strong> to Cornucopia Local.</p>
        <p>After review, we were unable to approve this product at this time:</p>
        <blockquote style="border-left: 3px solid #0B4D2C; padding-left: 12px; color: #555;">
          ${rejectionNote}
        </blockquote>
        <p>You can update your product and resubmit from your dashboard.</p>
        <p>If you have questions, reply to this email or contact us at support@cornucopialocal.com</p>
        <p>— The Cornucopia Team</p>
      `
    })
  } catch (error) {
    console.error('Failed to send product rejection email:', error)
    // Don't throw - we don't want email failures to block the rejection
  }
}
