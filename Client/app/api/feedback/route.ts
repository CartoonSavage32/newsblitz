import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Type definition for feedback form data
interface FeedbackData {
  feedbackType: 'suggestion' | 'issue' | 'praise';
  category: 'content' | 'design' | 'performance' | 'features' | 'other';
  name?: string;
  email: string;
  message: string;
  rating?: string; // Only present when feedbackType === 'praise'
  device?: string; // Only present when feedbackType === 'issue'
}

// Create reusable transporter (created once, reused for all requests)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const emailUser = process.env.FEEDBACK_EMAIL_USER;
    const emailPassword = process.env.FEEDBACK_EMAIL_APP_PASSWORD;

    if (!emailUser || !emailPassword) {
      throw new Error('Email configuration missing: FEEDBACK_EMAIL_USER and FEEDBACK_EMAIL_APP_PASSWORD are required');
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword, // Gmail App Password
      },
    });
  }
  return transporter;
}

// Map feedback type to display name
function getFeedbackTypeDisplay(type: FeedbackData['feedbackType']): string {
  const typeMap: Record<FeedbackData['feedbackType'], string> = {
    suggestion: 'Suggestion',
    issue: 'Report Issue',
    praise: 'Praise',
  };
  return typeMap[type] || type;
}

// Map category to display name
function getCategoryDisplay(category: FeedbackData['category']): string {
  const categoryMap: Record<FeedbackData['category'], string> = {
    content: 'Content Quality',
    design: 'User Interface',
    performance: 'App Performance',
    features: 'Features',
    other: 'Other',
  };
  return categoryMap[category] || category;
}

// Build email body from feedback data
function buildEmailBody(feedbackData: FeedbackData): string {
  const timestamp = new Date().toISOString();
  const feedbackTypeDisplay = getFeedbackTypeDisplay(feedbackData.feedbackType);
  const categoryDisplay = getCategoryDisplay(feedbackData.category);

  let body = `New feedback submission received from NewsBlitz\n\n`;
  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  body += `Type: ${feedbackTypeDisplay}\n`;
  body += `Category: ${categoryDisplay}\n\n`;

  if (feedbackData.name) {
    body += `Name: ${feedbackData.name}\n`;
  }

  body += `Email: ${feedbackData.email}\n\n`;
  body += `Message:\n${feedbackData.message}\n\n`;

  // Include rating if present (only for praise type)
  if (feedbackData.rating) {
    const ratingLabels: Record<string, string> = {
      '5': '5 - Excellent',
      '4': '4 - Very Good',
      '3': '3 - Good',
      '2': '2 - Fair',
      '1': '1 - Poor',
    };
    body += `Rating: ${ratingLabels[feedbackData.rating] || feedbackData.rating}\n\n`;
  }

  // Include device info if present (only for issue type)
  if (feedbackData.device) {
    body += `Device Information: ${feedbackData.device}\n\n`;
  }

  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  body += `Submitted at: ${timestamp}\n`;

  return body;
}

export async function POST(request: Request) {
  try {
    const feedbackData = await request.json() as FeedbackData;

    // Validate required fields
    if (!feedbackData.feedbackType || !feedbackData.category || !feedbackData.message || !feedbackData.email) {
      return NextResponse.json(
        { error: 'Missing required fields: feedbackType, category, message, and email are required' },
        { status: 400 }
      );
    }

    // Validate feedbackType enum
    const validFeedbackTypes: FeedbackData['feedbackType'][] = ['suggestion', 'issue', 'praise'];
    if (!validFeedbackTypes.includes(feedbackData.feedbackType)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Validate category enum
    const validCategories: FeedbackData['category'][] = ['content', 'design', 'performance', 'features', 'other'];
    if (!validCategories.includes(feedbackData.category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(feedbackData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate message is not empty
    if (typeof feedbackData.message !== 'string' || feedbackData.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    // Send email using Nodemailer
    try {
      const mailTransporter = getTransporter();
      const emailUser = process.env.FEEDBACK_EMAIL_USER;
      const emailTo = process.env.FEEDBACK_EMAIL_TO || emailUser;

      if (!emailTo) {
        throw new Error('FEEDBACK_EMAIL_TO or FEEDBACK_EMAIL_USER must be set');
      }

      const feedbackTypeDisplay = getFeedbackTypeDisplay(feedbackData.feedbackType);
      const emailSubject = `[NewsBlitz Feedback] ${feedbackTypeDisplay}`;
      const emailBody = buildEmailBody(feedbackData);

      await mailTransporter.sendMail({
        from: emailUser,
        to: emailTo,
        subject: emailSubject,
        text: emailBody,
      });

      console.log('Feedback email sent successfully');
    } catch (emailError) {
      // Log email error but don't expose sensitive details to frontend
      console.error('Failed to send feedback email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send feedback. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Feedback received successfully',
      type: feedbackData.feedbackType,
      category: feedbackData.category,
    });
  } catch (error) {
    console.error('Feedback processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

