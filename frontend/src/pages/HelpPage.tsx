import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Zap } from 'lucide-react';

// Firebase Imports (using standard module imports, assumed available in the environment)
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

// --- Global Setup (Simulating environment variables) ---
// MANDATORY: Global Variables already provided for Firestore
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Mandatory: Set log level for debugging
setLogLevel('Debug');

// --- LLM API Configuration ---
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_KEY = ""; // Provided by Canvas environment
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
const SYSTEM_PROMPT = `You are the friendly, helpful AI Customer Service Agent for LettucEat, a food ordering and tracking app. Your goal is to provide immediate, actionable troubleshooting steps based on the user's reported order issue.
1. Acknowledge the user's frustration calmly.
2. Provide 1-3 clear, numbered steps for resolution.
3. Refer to the app's features (like 'live tracking' or 'in-app chat').
4. Keep the response brief, professional, and supportive.
5. Use markdown for lists and emphasis.`;


// Helper for API calls with exponential backoff
const fetchWithExponentialBackoff = async (url, options, maxRetries = 5) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status !== 429) {
                return response;
            }
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('API call failed after multiple retries.');
};



const HelpPage = () => {
    const [activeTab, setActiveTab] = useState('how-it-works');
    const [issueInput, setIssueInput] = useState('');
    const [resolutionOutput, setResolutionOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [userId, setUserId] = useState(null);

    // Simulated FAQ Data
    const faqs = [
        { title: "How do I reset my password?", content: "Go to the Login page and click \"Forgot Password.\" Enter the email associated with your account, and we will send you a link to securely reset your password." },
        { title: "What is the average delivery time?", content: "Delivery times vary depending on the restaurant's preparation time and the distance to your location. The live tracking feature provides an Estimated Time of Arrival (ETA) once the restaurant confirms your order, usually ranging from 30 to 60 minutes." },
        { title: "Can I cancel or modify my order?", content: "Cancellations or modifications can only be made *before* the restaurant accepts the order. If the status is \"Order Confirmed\" or later, please contact our support chat immediately, and we will do our best to assist." },
        { title: "What if my food arrives damaged or incorrect?", content: "We apologize for any inconvenience! Please take a photo of the damaged or incorrect item and contact our customer support immediately via the in-app chat. We will arrange a refund or a re-delivery as quickly as possible." }
    ];

    // Initialize Firebase and Authentication
    useEffect(() => {
        const initFirebase = async () => {
            try {
                if (Object.keys(firebaseConfig).length === 0) {
                    console.error("Firebase config is missing. Cannot initialize Firebase.");
                    return;
                }

                const app = initializeApp(firebaseConfig);
                const authInstance = getAuth(app);
                const dbInstance = getFirestore(app);

                // Authentication
                if (initialAuthToken) {
                    await signInWithCustomToken(authInstance, initialAuthToken);
                    console.log("Authenticated using custom token.");
                } else {
                    await signInAnonymously(authInstance);
                    console.log("Signed in anonymously.");
                }

                // Auth State Listener
                const unsubscribe = onAuthStateChanged(authInstance, (user) => {
                    if (user) {
                        setUserId(user.uid);
                    } else {
                        setUserId(null);
                    }
                    setAuthReady(true);
                });

                return () => unsubscribe(); // Cleanup listener

            } catch (error) {
                console.error("Firebase Initialization or Authentication Error:", error);
                setAuthReady(true); // Still mark as ready even if error occurred
            }
        };

        initFirebase();
    }, []);


    // Gemini API Call function
    const resolveIssue = useCallback(async () => {
        const userQuery = issueInput.trim();

        if (!userQuery) {
            setResolutionOutput('<p class="text-red-600">Please describe your order issue before getting resolution steps.</p>');
            return;
        }

        setIsLoading(true);
        setResolutionOutput('');

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                tools: [{ "google_search": {} }],
                systemInstruction: {
                    parts: [{ text: SYSTEM_PROMPT }]
                },
            };

            const response = await fetchWithExponentialBackoff(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            const candidate = result.candidates?.[0];
            let generatedText = "Sorry, I couldn't process your request right now. Please try again or contact live support.";

            if (candidate && candidate.content?.parts?.[0]?.text) {
                generatedText = candidate.content.parts[0].text;
            }

            // Format the output: convert newlines to <br> for HTML rendering
            setResolutionOutput(
                `<h5 class="font-bold mb-2">Our Suggested Steps:</h5>${generatedText.replace(/\n/g, '<br>')}`
            );

        } catch (error) {
            console.error("Gemini API Error:", error);
            setResolutionOutput('<p class="text-red-600">An error occurred while contacting the AI assistant. Please check your connection or try again later.</p>');
        } finally {
            setIsLoading(false);
        }
    }, [issueInput]);


    const isHowItWorksActive = activeTab === 'how-it-works';
    const isFaqActive = activeTab === 'faq';

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h2 className="text-4xl font-extrabold text-gray-800 mb-8 mt-4">Help Center</h2>
            {/* Display Auth status for debugging, optional to remove */}
            <p className="text-sm text-gray-500 mb-4">Auth Status: {authReady ? (userId ? `Signed In (ID: ${userId})` : 'Signed Anonymously') : 'Initializing...'}</p>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="flex space-x-4">
                    <button
                        className={`py-2 px-4 text-lg text-gray-600 focus:outline-none transition duration-150 ease-in-out ${isHowItWorksActive ? 'active-tab' : ''}`}
                        onClick={() => setActiveTab('how-it-works')}
                    >
                        How It Works
                    </button>
                    <button
                        className={`py-2 px-4 text-lg text-gray-600 focus:outline-none transition duration-150 ease-in-out ${isFaqActive ? 'active-tab' : ''}`}
                        onClick={() => setActiveTab('faq')}
                    >
                        FAQ
                    </button>
                </nav>
            </div>

            {/* How It Works Section */}
            <section className={`bg-white p-6 rounded-xl shadow-lg ${isHowItWorksActive ? 'block' : 'hidden'}`}>
                <h3 className="text-2xl font-bold mb-6 border-b pb-2 text-gray-700">How Ordering and Tracking Works</h3>

                <div className="space-y-8">
                    {/* Step 1: Find Your Food */}
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#8cc63f] text-white font-bold text-xl shadow-md">1</div>
                        <div>
                            <h4 className="text-xl font-semibold text-gray-800 mb-1">Search & Select</h4>
                            <p className="text-gray-600">Use the search bar and filters (Cuisine, Price Range) on the homepage to find local restaurants. Click on a restaurant, like 'Sushi Master' or 'Curry House', to browse their full menu.</p>
                        </div>
                    </div>
                    {/* Step 2: Customize and Order */}
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#8cc63f] text-white font-bold text-xl shadow-md">2</div>
                        <div>
                            <h4 className="text-xl font-semibold text-gray-800 mb-1">Build Your Cart</h4>
                            <p className="text-gray-600">Add your desired items to the cart. You can customize dishes with special requests or modifiers (e.g., 'no onions,' 'extra spice'). Review your order and proceed to checkout.</p>
                        </div>
                    </div>
                    {/* Step 3: Secure Payment */}
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#8cc63f] text-white font-bold text-xl shadow-md">3</div>
                        <div>
                            <h4 className="text-xl font-semibold text-gray-800 mb-1">Checkout & Pay</h4>
                            <p className="text-gray-600">Enter your delivery address and choose your preferred payment method (Credit Card, PayPal, etc.). We use secure encryption to ensure your payment details are safe. Once confirmed, place the order!</p>
                        </div>
                    </div>
                    {/* Step 4: Live Tracking */}
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#8cc63f] text-white font-bold text-xl shadow-md">4</div>
                        <div>
                            <h4 className="text-xl font-semibold text-gray-800 mb-1">Track Your Meal</h4>
                            <p className="text-gray-600">Once the restaurant accepts the order, you can follow its progress in real-time. The tracking screen shows four main states: **Order Confirmed**, **Preparation**, **Out for Delivery**, and **Delivered**. You'll see an estimated arrival time (ETA) that updates dynamically.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className={`bg-white p-6 rounded-xl shadow-lg ${isFaqActive ? 'block' : 'hidden'}`}>
                <h3 className="text-2xl font-bold mb-6 border-b pb-2 text-gray-700">Frequently Asked Questions</h3>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <Accordion key={index} title={faq.title} content={faq.content} />
                    ))}
                </div>

                {/* LLM-Powered Resolution Assistant */}
                <div className="mt-8 pt-6 border-t border-[#8cc63f]/50">
                    <h4 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-[#8cc63f]" /> AI Order Assistant
                    </h4>
                    <p className="text-gray-600 mb-4">Describe your specific order issue below (e.g., "My curry is 15 minutes late," or "I received the wrong drink"), and our AI Assistant will provide immediate, tailored troubleshooting steps.</p>

                    <textarea
                        id="issue-input"
                        rows="3"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#8cc63f] focus:border-[#8cc63f] transition duration-150"
                        placeholder="E.g., My order from Sushi Master is 20 minutes past the ETA."
                        value={issueInput}
                        onChange={(e) => setIssueInput(e.target.value)}
                    ></textarea>

                    <button
                        id="resolve-button"
                        className="bg-[#8cc63f] text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-[#8cc63f]/80 transition duration-150 mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={resolveIssue}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Analyzing...' : '✨ Get Resolution Steps'}
                    </button>

                    {isLoading && (
                        <div id="loading-indicator" className="mt-4 text-[#8cc63f] flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#8cc63f]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing your issue...
                        </div>
                    )}

                    {resolutionOutput && (
                        <div
                            id="resolution-output"
                            className="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-200 text-gray-700"
                            dangerouslySetInnerHTML={{ __html: resolutionOutput }}
                        />
                    )}
                </div>
            </section>
        </div>
    );
};
