"use client";

import type React from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "../../src/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../src/components/ui/card";
import { Input } from "../../src/components/ui/input";
import { Label } from "../../src/components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../src/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../src/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "../../src/components/ui/tabs";
import { API_BASE_URL } from "../../src/lib/apiConfig";
import { MobileBottomNavbar } from "../../src/components/mobile/MobileBottomNavbar";
import { useMediaQuery } from "../../src/hooks/useMobile";

export default function DonatePage() {
    const [amount, setAmount] = useState("10");
    const [customAmount, setCustomAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [frequency, setFrequency] = useState("one-time");
    const [donorInfo, setDonorInfo] = useState({
        firstName: "",
        lastName: "",
        email: "",
        country: ""
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");
    // Add modal states
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [transactionId, setTransactionId] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsProcessing(true);
        
        try {
            const donationData = {
                amount: amount === "custom" ? customAmount : amount,
                frequency,
                paymentMethod,
                donorInfo,
                timestamp: new Date().toISOString()
            };
            
            console.log(donationData);
            const response = await fetch(`${API_BASE_URL}/api/donate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(donationData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            setTransactionId(result.transactionId);
            setShowSuccessModal(true);
            
            // Reset form
            setAmount("10");
            setCustomAmount("");
            setFrequency("one-time");
            setPaymentMethod("card");
            setDonorInfo({
                firstName: "",
                lastName: "",
                email: "",
                country: ""
            });
            
        } catch (error) {
            console.error('Donation submission error: ', error);
            setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
            setShowErrorModal(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAmountChange = (value: string) => {
        setAmount(value);
        if (value !== "custom") {
            setCustomAmount("");
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Thank You for Your Donation!
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Your contribution helps us deliver quality journalism. We've sent a confirmation email to {donorInfo.email}.
                            </p>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 mb-4">
                                <p className="text-xs text-gray-600 dark:text-gray-300">Transaction ID</p>
                                <p className="text-sm font-mono text-gray-900 dark:text-gray-100">{transactionId}</p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        window.location.href = '/feedback';
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Feedback
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        window.location.href = '/news';
                                    }}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    News
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
                                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Transaction Failed
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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
                                        // Optionally retry the transaction
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
                        <h1 className="mt-4 text-3xl font-bold tracking-tight">Support NewsBlitz</h1>
                        <p className="mt-2 text-muted-foreground">
                            Your contribution helps us deliver quality news and keep our service accessible to everyone.
                        </p>
                    </div>

                    <Card>
                        <form onSubmit={handleSubmit}>
                            <CardHeader>
                                <CardTitle>Make a Donation (DUMMY PAGE)</CardTitle>
                                <CardDescription>Choose an amount and payment method to support our journalism.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Donation Frequency */}
                                <div className="space-y-2">
                                    <Label>Donation Frequency</Label>
                                    <Tabs defaultValue="one-time" value={frequency} onValueChange={setFrequency} className="w-full">
                                        <TabsList className="grid grid-cols-3 w-full">
                                            <TabsTrigger
                                                value="one-time"
                                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                            >
                                                One-time
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="monthly"
                                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                            >
                                                Monthly
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="yearly"
                                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                            >
                                                Yearly
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>

                                {/* Donation Amount */}
                                <div className="space-y-2">
                                    <Label>Donation Amount</Label>
                                    <RadioGroup value={amount} onValueChange={handleAmountChange} className="grid grid-cols-3 gap-2">
                                        <div className="flex items-center justify-center">
                                            <Label
                                                htmlFor="amount-5"
                                                className={`w-full h-12 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${amount === "5"
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-input bg-background hover:bg-muted"
                                                    }`}
                                            >
                                                <RadioGroupItem value="5" id="amount-5" className="sr-only" />
                                                $5
                                            </Label>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <Label
                                                htmlFor="amount-10"
                                                className={`w-full h-12 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${amount === "10"
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-input bg-background hover:bg-muted"
                                                    }`}
                                            >
                                                <RadioGroupItem value="10" id="amount-10" className="sr-only" />
                                                $10
                                            </Label>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <Label
                                                htmlFor="amount-25"
                                                className={`w-full h-12 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${amount === "25"
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-input bg-background hover:bg-muted"
                                                    }`}
                                            >
                                                <RadioGroupItem value="25" id="amount-25" className="sr-only" />
                                                $25
                                            </Label>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <Label
                                                htmlFor="amount-50"
                                                className={`w-full h-12 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${amount === "50"
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-input bg-background hover:bg-muted"
                                                    }`}
                                            >
                                                <RadioGroupItem value="50" id="amount-50" className="sr-only" />
                                                $50
                                            </Label>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <Label
                                                htmlFor="amount-100"
                                                className={`w-full h-12 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${amount === "100"
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-input bg-background hover:bg-muted"
                                                    }`}
                                            >
                                                <RadioGroupItem value="100" id="amount-100" className="sr-only" />
                                                $100
                                            </Label>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <Label
                                                htmlFor="amount-custom"
                                                className={`w-full h-12 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${amount === "custom"
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-input bg-background hover:bg-muted"
                                                    }`}
                                            >
                                                <RadioGroupItem value="custom" id="amount-custom" className="sr-only" />
                                                Custom
                                            </Label>
                                        </div>
                                    </RadioGroup>

                                    {amount === "custom" && (
                                        <div className="mt-2">
                                            <Label htmlFor="custom-amount" className="sr-only">
                                                Custom Amount
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                <Input
                                                    id="custom-amount"
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    className="pl-8"
                                                    placeholder="Enter amount"
                                                    value={customAmount}
                                                    onChange={(e) => setCustomAmount(e.target.value)}
                                                    required={amount === "custom"}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-2">
                                    <Label htmlFor="payment-method">Payment Method</Label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod} defaultValue="card">
                                        <SelectTrigger id="payment-method">
                                            <SelectValue placeholder="Select payment method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="card">Credit/Debit Card</SelectItem>
                                            <SelectItem value="paypal">PayPal</SelectItem>
                                            <SelectItem value="apple">Apple Pay</SelectItem>
                                            <SelectItem value="google">Google Pay</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Donor Information */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Donor Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="first-name">First Name</Label>
                                            <Input 
                                                id="first-name" 
                                                value={donorInfo.firstName}
                                                onChange={(e)=> setDonorInfo({...donorInfo,firstName:e.target.value})}
                                                required 
                                                />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="last-name">Last Name</Label>
                                            <Input 
                                                id="last-name" 
                                                value={donorInfo.lastName}
                                                onChange={(e)=> setDonorInfo({...donorInfo,lastName:e.target.value})}
                                                required 
                                                />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input 
                                            id="email"
                                            type="email"
                                            value={donorInfo.email}
                                            onChange={(e) => setDonorInfo({...donorInfo, email: e.target.value})}
                                            required  
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country">Country</Label>
                                        <Select defaultValue="india" value={donorInfo.country} onValueChange={(value)=> setDonorInfo({...donorInfo,country:value})}>
                                            <SelectTrigger id="country">
                                                <SelectValue placeholder="Select your country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="us">United States</SelectItem>
                                                <SelectItem value="ca">Canada</SelectItem>
                                                <SelectItem value="uk">United Kingdom</SelectItem>
                                                <SelectItem value="au">Australia</SelectItem>
                                                <SelectItem value="de">Germany</SelectItem>
                                                <SelectItem value="fr">France</SelectItem>
                                                <SelectItem value="jp">Japan</SelectItem>
                                                <SelectItem value="in">India</SelectItem>
                                                <SelectItem value="br">Brazil</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col space-y-4">
                                <Button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12"
                                    disabled={isProcessing || (amount === "custom" && !customAmount)}
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Processing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Heart className="h-4 w-4" />
                                            {`Donate $${amount === "custom" ? customAmount : amount}${frequency !== "one-time" ? ` ${frequency}` : ""}`}
                                        </span>
                                    )}
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                    Your donation helps us deliver quality journalism. NewsBlitz is a registered non-profit organization.
                                    All donations are tax-deductible where applicable.
                                </p>
                            </CardFooter>
                        </form>
                    </Card>

                    {/* Additional Information */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Where Your Money Goes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="rounded-full bg-primary p-1 mt-0.5">
                                            <span className="block h-1.5 w-1.5 rounded-full bg-primary-foreground"></span>
                                        </span>
                                        <span>Enhancing news variety through smarter curation.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="rounded-full bg-primary p-1 mt-0.5">
                                            <span className="block h-1.5 w-1.5 rounded-full bg-primary-foreground"></span>
                                        </span>
                                        <span>Maintaining and improving our platform</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="rounded-full bg-primary p-1 mt-0.5">
                                            <span className="block h-1.5 w-1.5 rounded-full bg-primary-foreground"></span>
                                        </span>
                                        <span>Expanding coverage to underreported areas</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Other Ways to Support</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="rounded-full bg-primary p-1 mt-0.5">
                                            <span className="block h-1.5 w-1.5 rounded-full bg-primary-foreground"></span>
                                        </span>
                                        <span>Share our articles with friends and family</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="rounded-full bg-primary p-1 mt-0.5">
                                            <span className="block h-1.5 w-1.5 rounded-full bg-primary-foreground"></span>
                                        </span>
                                        <span>Subscribe to our newsletter</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="rounded-full bg-primary p-1 mt-0.5">
                                            <span className="block h-1.5 w-1.5 rounded-full bg-primary-foreground"></span>
                                        </span>
                                        <span>Provide feedback to help us improve</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
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
            {isMobile && <MobileBottomNavbar disableDonate={true} />}
        </div>
    );
}

