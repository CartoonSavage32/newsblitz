"use client";

import { ArrowLeft, CheckCircle, Send, XCircle } from "lucide-react";
import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "../../src/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../src/components/ui/card";
import { Input } from "../../src/components/ui/input";
import { Label } from "../../src/components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../src/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../src/components/ui/select";
import { Textarea } from "../../src/components/ui/textarea";
import { API_BASE_URL } from "../../src/lib/apiConfig";
import { MobileBottomNavbar } from "../../src/components/mobile/MobileBottomNavbar";
import { useMediaQuery } from "../../src/hooks/useMobile";

export default function Feedback() {
    const [feedbackType, setFeedbackType] = useState("suggestion");
    const [category, setCategory] = useState("content");
    const [rating, setRating] = useState("5");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");
    
    // Modal states
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData(event.currentTarget);
            const feedbackData = {
                feedbackType,
                category: category,
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message'),
                rating: feedbackType === 'praise' ? rating : undefined,
                device: formData.get('device')
            };

            console.log('Sending feedback data:', feedbackData);

            const response = await fetch(`${API_BASE_URL}/api/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackData)
            });

            const result = await response.json();

            // Debug: Log what we received
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            console.log('Result:', result);

            if (response.ok && result.ok) {
                console.log('✅ SUCCESS: Showing success modal');
                // Show success modal
                setShowSuccessModal(true);
                // Reset form safely
                if (event.currentTarget) {
                    event.currentTarget.reset();
                }
                setFeedbackType("suggestion");
                setCategory("content");
                setRating("5");
            } else {
                console.log('❌ ERROR: Showing error modal');
                // Show error modal
                setErrorMessage(result.error || "Failed to submit feedback. Please try again.");
                setShowErrorModal(true);
            }
        } catch (error) {
            console.error('Feedback submission error:', error);
            setErrorMessage("Failed to submit feedback. Please check your connection and try again.");
            setShowErrorModal(true);
        }

        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Thank You!
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Your feedback has been submitted successfully. We appreciate your input and will use it to improve our service.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        window.location.href = '/';
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Go Home
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        // Form is already reset, so user can submit another feedback
                                    }}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    Submit Another
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Submission Failed
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                {errorMessage}
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setShowErrorModal(false)}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowErrorModal(false);
                                        // User can try submitting again
                                    }}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 container py-8 md:py-12">
                <div className="mx-auto max-w-2xl">
                    <div className="mb-8">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to home
                        </Link>
                        <h1 className="mt-4 text-3xl font-bold tracking-tight">Share Your Feedback</h1>
                        <p className="mt-2 text-muted-foreground">
                            We value your input to help us improve our news service. Please share your thoughts with us.
                        </p>
                    </div>

                    <Card>
                        <form onSubmit={handleSubmit}>
                            <CardHeader>
                                <CardTitle>Feedback Form</CardTitle>
                                <CardDescription>
                                    Let us know what you think about our app. All fields marked with * are required.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Feedback Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="feedback-type">Feedback Type *</Label>
                                    <RadioGroup
                                        defaultValue="suggestion"
                                        value={feedbackType}
                                        onValueChange={setFeedbackType}
                                        className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="suggestion" id="suggestion" />
                                            <Label htmlFor="suggestion" className="cursor-pointer">
                                                Suggestion
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="issue" id="issue" />
                                            <Label htmlFor="issue" className="cursor-pointer">
                                                Report Issue
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="praise" id="praise" />
                                            <Label htmlFor="praise" className="cursor-pointer">
                                                Praise
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="content">Content Quality</SelectItem>
                                            <SelectItem value="design">User Interface</SelectItem>
                                            <SelectItem value="performance">App Performance</SelectItem>
                                            <SelectItem value="features">Features</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Contact Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input id="name" name="name" placeholder="Your name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input id="email" name="email" type="email" placeholder="your.email@example.com" required />
                                    </div>
                                </div>

                                {/* Feedback Message */}
                                <div className="space-y-2">
                                    <Label htmlFor="message">Your Feedback *</Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        placeholder="Please share your detailed feedback here..."
                                        className="min-h-[120px]"
                                        required
                                    />
                                </div>

                                {/* Rating */}
                                {feedbackType === "praise" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="rating">How would you rate our app? *</Label>
                                        <Select value={rating} onValueChange={setRating}>
                                            <SelectTrigger id="rating">
                                                <SelectValue placeholder="Select rating" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5 - Excellent</SelectItem>
                                                <SelectItem value="4">4 - Very Good</SelectItem>
                                                <SelectItem value="3">3 - Good</SelectItem>
                                                <SelectItem value="2">2 - Fair</SelectItem>
                                                <SelectItem value="1">1 - Poor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Issue Details */}
                                {feedbackType === "issue" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="device">Device Information</Label>
                                        <Input id="device" name="device" placeholder="e.g., iPhone 13, Chrome on Windows" />
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" type="button" onClick={() => window.history.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Submitting...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Send className="h-4 w-4" />
                                            Submit Feedback
                                        </span>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t py-6 md:py-0" style={{ paddingBottom: isMobile ? '64px' : undefined }}>
                <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:h-16">
                    <p className="text-sm text-muted-foreground">© 2025 NewsBlitz. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/feedback" className="text-sm text-muted-foreground hover:text-foreground">
                            Contact
                        </Link>
                    </div>
                </div>
            </footer>
            
            {/* Mobile Bottom Navigation */}
            {isMobile && <MobileBottomNavbar />}
        </div>
    );
}

